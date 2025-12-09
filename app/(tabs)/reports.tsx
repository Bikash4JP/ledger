// app/(tabs)/reports.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import { getLedgerLabel, getLedgerLabelByName } from '../../src/utils/ledgerLabels';

import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';


const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

type ReportMode = 'overall' | 'monthly' | 'yearly';

type TrialRow = {
  ledgerId: string;
  name: string;
  debit: number;
  credit: number;
};

type PlRow = {
  ledgerId: string;
  name: string;
  amount: number;
};

type BsRow = {
  ledgerId: string;
  name: string;
  amount: number;
};

type CashFlowLedgerRow = {
  ledgerId: string;
  name: string;
  inflow: number;
  outflow: number;
};

type CashFlowSummary = {
  perLedger: CashFlowLedgerRow[];
  totalIn: number;
  totalOut: number;
  net: number;
};

type LedgerAnalysisRow = {
  ledgerId: string;
  name: string;
  groupName: string;
  turnover: number;
  closing: number;
  closingType: 'Dr' | 'Cr' | '';
};

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.replace(/\./g, '-').replace(/\//g, '-');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function ReportsScreen() {
  const { ledgers, transactions } = useData();
  
  const [mode, setMode] = useState<ReportMode>('overall');

  const today = useMemo(() => new Date(), []);

  const periodLabel = useMemo(() => {
    const y = today.getFullYear();
    const m = `${today.getMonth() + 1}`.padStart(2, '0');

    switch (mode) {
      case 'monthly':
        return `This Month (${y}-${m})`;
      case 'yearly':
        return `This Year (${y})`;
      default:
        return 'All Transactions';
    }
  }, [mode, today]);

  const filteredTransactions: Transaction[] = useMemo(() => {
    if (mode === 'overall') return transactions;

    return transactions.filter((t: Transaction) => {
      const d = parseDateSafe(t.date);
      if (!d) return false;

      if (mode === 'monthly') {
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth()
        );
      }

      // yearly
      return d.getFullYear() === today.getFullYear();
    });
  }, [mode, transactions, today]);

  const ledgerMap = useMemo(() => {
    const map: Record<string, Ledger> = {};
    ledgers.forEach((l: Ledger) => {
      map[l.id] = l;
    });
    return map;
  }, [ledgers]);

  // ========== TRIAL BALANCE ==========
  const trialRows: TrialRow[] = useMemo(() => {
    const rows: TrialRow[] = ledgers.map((ledger: Ledger) => {
      let debitTotal = 0;
      let creditTotal = 0;

      filteredTransactions.forEach((t: Transaction) => {
        if (t.debitLedgerId === ledger.id) debitTotal += t.amount;
        if (t.creditLedgerId === ledger.id) creditTotal += t.amount;
      });

      return {
        ledgerId: ledger.id,
        name: ledger.name,
        debit: debitTotal,
        credit: creditTotal,
      };
    });

    return rows.filter((r: TrialRow) => r.debit > 0 || r.credit > 0);
  }, [ledgers, filteredTransactions]);

  const trialTotals = useMemo(
    () =>
      trialRows.reduce(
        (acc: { debit: number; credit: number }, row: TrialRow) => {
          acc.debit += row.debit;
          acc.credit += row.credit;
          return acc;
        },
        { debit: 0, credit: 0 },
      ),
    [trialRows],
  );

  // ========== PROFIT & LOSS ==========
  const {
    expenseRows,
    incomeRows,
    totalExpense,
    totalIncome,
    netProfit,
    netLoss,
  }: {
    expenseRows: PlRow[];
    incomeRows: PlRow[];
    totalExpense: number;
    totalIncome: number;
    netProfit: number;
    netLoss: number;
  } = useMemo(() => {
    const expenses: PlRow[] = [];
    const incomes: PlRow[] = [];

    trialRows.forEach((row: TrialRow) => {
      const ledger = ledgerMap[row.ledgerId];
      if (!ledger) return;

      if (ledger.nature === 'Expense') {
        const amount = row.debit - row.credit;
        if (amount > 0) {
          expenses.push({
            ledgerId: row.ledgerId,
            name: ledger.name,
            amount,
          });
        }
      } else if (ledger.nature === 'Income') {
        const amount = row.credit - row.debit;
        if (amount > 0) {
          incomes.push({
            ledgerId: row.ledgerId,
            name: ledger.name,
            amount,
          });
        }
      }
    });

    const totalExp = expenses.reduce((s, r) => s + r.amount, 0);
    const totalInc = incomes.reduce((s, r) => s + r.amount, 0);
    const diff = totalInc - totalExp;

    return {
      expenseRows: expenses,
      incomeRows: incomes,
      totalExpense: totalExp,
      totalIncome: totalInc,
      netProfit: diff > 0 ? diff : 0,
      netLoss: diff < 0 ? -diff : 0,
    };
  }, [trialRows, ledgerMap]);

  // ========== BALANCE SHEET ==========
  const {
    assetRows,
    liabilityRows,
    totalAssets,
    totalLiabilities,
  }: {
    assetRows: BsRow[];
    liabilityRows: BsRow[];
    totalAssets: number;
    totalLiabilities: number;
  } = useMemo(() => {
    const assets: BsRow[] = [];
    const liabilities: BsRow[] = [];

    trialRows.forEach((row: TrialRow) => {
      const ledger = ledgerMap[row.ledgerId];
      if (!ledger) return;

      let balance = 0;

      if (ledger.nature === 'Asset' || ledger.nature === 'Expense') {
        balance = row.debit - row.credit;
      } else if (ledger.nature === 'Liability' || ledger.nature === 'Income') {
        balance = row.credit - row.debit;
      }

      if (balance <= 0) return;

      if (ledger.nature === 'Asset') {
        assets.push({
          ledgerId: row.ledgerId,
          name: ledger.name,
          amount: balance,
        });
      } else if (ledger.nature === 'Liability') {
        liabilities.push({
          ledgerId: row.ledgerId,
          name: ledger.name,
          amount: balance,
        });
      }
    });

    if (netProfit > 0) {
      liabilities.push({
        ledgerId: 'PL_PROFIT',
        name: 'Net Profit (from P&L)',
        amount: netProfit,
      });
    } else if (netLoss > 0) {
      assets.push({
        ledgerId: 'PL_LOSS',
        name: 'Net Loss (from P&L)',
        amount: netLoss,
      });
    }

    const totalA = assets.reduce((s, r) => s + r.amount, 0);
    const totalL = liabilities.reduce((s, r) => s + r.amount, 0);

    return {
      assetRows: assets,
      liabilityRows: liabilities,
      totalAssets: totalA,
      totalLiabilities: totalL,
    };
  }, [trialRows, ledgerMap, netProfit, netLoss]);

  // ========== CASH FLOW (CASH / BANK MOVEMENT) ==========
  const cashFlow: CashFlowSummary = useMemo(() => {
    const allLedgers: Ledger[] = Object.values(ledgerMap);
    // simple heuristic: ledger name me "cash" ya "bank"
    const cashLedgerIds: string[] = allLedgers
      .filter((l: Ledger) => /cash|bank/i.test(l.name))
      .map((l) => l.id);

    if (cashLedgerIds.length === 0) {
      return {
        perLedger: [],
        totalIn: 0,
        totalOut: 0,
        net: 0,
      };
    }

    const perMap: Record<string, CashFlowLedgerRow> = {};

    const ensureRow = (ledgerId: string): CashFlowLedgerRow => {
      const ledger = ledgerMap[ledgerId];
      if (!ledger) {
        return {
          ledgerId,
          name: ledgerId,
          inflow: 0,
          outflow: 0,
        };
      }
      if (!perMap[ledgerId]) {
        perMap[ledgerId] = {
          ledgerId,
          name: ledger.name,
          inflow: 0,
          outflow: 0,
        };
      }
      return perMap[ledgerId];
    };

    filteredTransactions.forEach((t: Transaction) => {
      if (cashLedgerIds.includes(t.debitLedgerId)) {
        const row = ensureRow(t.debitLedgerId);
        row.inflow += t.amount;
      }
      if (cashLedgerIds.includes(t.creditLedgerId)) {
        const row = ensureRow(t.creditLedgerId);
        row.outflow += t.amount;
      }
    });

    const perLedger = Object.values(perMap).filter(
      (r: CashFlowLedgerRow) => r.inflow > 0 || r.outflow > 0,
    );

    const totalIn = perLedger.reduce((s, r) => s + r.inflow, 0);
    const totalOut = perLedger.reduce((s, r) => s + r.outflow, 0);
    const net = totalIn - totalOut;

    return {
      perLedger,
      totalIn,
      totalOut,
      net,
    };
  }, [filteredTransactions, ledgerMap]);

  // ========== LEDGER ANALYSIS (TURNOVER + CLOSING) ==========
  const ledgerAnalysis: LedgerAnalysisRow[] = useMemo(() => {
    const rows: LedgerAnalysisRow[] = trialRows
      .map((row: TrialRow) => {
        const ledger = ledgerMap[row.ledgerId];
        if (!ledger) return null;

        const turnover = row.debit + row.credit;
        if (turnover === 0) return null;

        let closing = 0;
        let closingType: 'Dr' | 'Cr' | '' = '';

        if (ledger.nature === 'Asset' || ledger.nature === 'Expense') {
          closing = row.debit - row.credit;
          if (closing > 0) closingType = 'Dr';
          else if (closing < 0) {
            closingType = 'Cr';
            closing = Math.abs(closing);
          }
        } else if (ledger.nature === 'Liability' || ledger.nature === 'Income') {
          closing = row.credit - row.debit;
          if (closing > 0) closingType = 'Cr';
          else if (closing < 0) {
            closingType = 'Dr';
            closing = Math.abs(closing);
          }
        }

        return {
          ledgerId: row.ledgerId,
          name: ledger.name,
          groupName: ledger.groupName,
          turnover,
          closing,
          closingType,
        };
      })
      .filter((r): r is LedgerAnalysisRow => r !== null);

    // Top 10 by turnover for quick analysis
    rows.sort((a, b) => b.turnover - a.turnover);
    return rows.slice(0, 10);
  }, [trialRows, ledgerMap]);

  const renderModeTag = (value: ReportMode, label: string) => {
    const selected = mode === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.modeChip, selected && styles.modeChipSelected]}
        onPress={() => setMode(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.modeChipText, selected && styles.modeChipTextSelected]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>
            Trial balance, Profit &amp; Loss, Balance Sheet, Cash Flow &amp; Ledger Summary ({periodLabel}).
          </Text>
        </View>
      </View>

      <View style={styles.modesRow}>
        {renderModeTag('overall', 'Overall')}
        {renderModeTag('monthly', 'Monthly')}
        {renderModeTag('yearly', 'Yearly')}
      </View>

      {/* TRIAL BALANCE */}
      <View className="tb-section" style={styles.section}>
        <Text style={styles.sectionTitle}>Trial Balance</Text>
        <Text style={styles.sectionHint}>{periodLabel}</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellLedger, styles.tableHeaderText]}>
            Ledger
          </Text>
          <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
            Debit
          </Text>
          <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
            Credit
          </Text>
        </View>

        {trialRows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          <>
            {trialRows.map((row: TrialRow) => (
              <View style={styles.tableRow} key={row.ledgerId}>
                <Text style={styles.tableCellLedger}>{row.name}</Text>
                <Text style={[styles.tableCellAmt, styles.right]}>
                  {row.debit
                    ? `¥${row.debit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}`
                    : ''}
                </Text>
                <Text style={[styles.tableCellAmt, styles.right]}>
                  {row.credit
                    ? `¥${row.credit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}`
                    : ''}
                </Text>
              </View>
            ))}

            <View style={styles.tableFooterLine} />

            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLedger, styles.totalLabel]}>
                TOTAL
              </Text>
              <Text
                style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
              >
                ¥{trialTotals.debit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
              <Text
                style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
              >
                ¥{trialTotals.credit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* PROFIT & LOSS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profit &amp; Loss Account</Text>
        <Text style={styles.sectionHint}>{periodLabel}</Text>

        {expenseRows.length === 0 && incomeRows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No income/expense data yet.</Text>
          </View>
        ) : (
          <View style={styles.plColumnsRow}>
            <View style={styles.plColumn}>
              <Text style={styles.plColumnTitle}>Expenses (Dr)</Text>
              {expenseRows.map((row: PlRow) => (
                <View key={row.ledgerId} style={styles.plRow}>
                  <Text style={styles.plName}>{row.name}</Text>
                  <Text style={styles.plAmountRight}>
                    ¥{row.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
              <View style={styles.plTotalRow}>
                <Text style={styles.plTotalLabel}>Total Expenses</Text>
                <Text style={styles.plTotalAmount}>
                  ¥{totalExpense.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              {netProfit > 0 && (
                <View style={styles.plNetRow}>
                  <Text style={styles.plNetLabel}>Net Profit</Text>
                  <Text style={styles.plNetAmount}>
                    ¥{netProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.plColumn}>
              <Text style={styles.plColumnTitle}>Incomes (Cr)</Text>
              {incomeRows.map((row: PlRow) => (
                <View key={row.ledgerId} style={styles.plRow}>
                  <Text style={styles.plName}>{row.name}</Text>
                  <Text style={styles.plAmountRight}>
                    ¥{row.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
              <View style={styles.plTotalRow}>
                <Text style={styles.plTotalLabel}>Total Incomes</Text>
                <Text style={styles.plTotalAmount}>
                  ¥{totalIncome.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              {netLoss > 0 && (
                <View style={styles.plNetRowLoss}>
                  <Text style={styles.plNetLabel}>Net Loss</Text>
                  <Text style={styles.plNetAmount}>
                    ¥{netLoss.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* BALANCE SHEET */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balance Sheet</Text>
        <Text style={styles.sectionHint}>{periodLabel}</Text>

        {assetRows.length === 0 && liabilityRows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No assets/liabilities yet.</Text>
          </View>
        ) : (
          <View style={styles.bsColumnsRow}>
            <View style={styles.bsColumn}>
              <Text style={styles.bsColumnTitle}>Liabilities</Text>
              {liabilityRows.map((row: BsRow) => (
                <View key={row.ledgerId} style={styles.bsRow}>
                  <Text style={styles.bsName}>{row.name}</Text>
                  <Text style={styles.bsAmountRight}>
                    ¥{row.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
              <View style={styles.bsTotalRow}>
                <Text style={styles.bsTotalLabel}>Total Liabilities</Text>
                <Text style={styles.bsTotalAmount}>
                  ¥{totalLiabilities.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.bsColumn}>
              <Text style={styles.bsColumnTitle}>Assets</Text>
              {assetRows.map((row: BsRow) => (
                <View key={row.ledgerId} style={styles.bsRow}>
                  <Text style={styles.bsName}>{row.name}</Text>
                  <Text style={styles.bsAmountRight}>
                    ¥{row.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
              <View style={styles.bsTotalRow}>
                <Text style={styles.bsTotalLabel}>Total Assets</Text>
                <Text style={styles.bsTotalAmount}>
                  ¥{totalAssets.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* CASH FLOW (FUNCTIONAL) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cash Flow (Cash &amp; Bank)</Text>
        <Text style={styles.sectionHint}>
          Based on movement in cash / bank ledgers ({periodLabel})
        </Text>

        {cashFlow.perLedger.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No cash/bank movement in this period.</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellLedger, styles.tableHeaderText]}>
                Ledger
              </Text>
              <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
                Inflow
              </Text>
              <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
                Outflow
              </Text>
              <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
                Net
              </Text>
            </View>

            {cashFlow.perLedger.map((row: CashFlowLedgerRow) => {
              const net = row.inflow - row.outflow;
              return (
                <View key={row.ledgerId} style={styles.tableRow}>
                  <Text style={styles.tableCellLedger}>{row.name}</Text>
                  <Text style={[styles.tableCellAmt, styles.right]}>
                    {row.inflow
                      ? `¥${row.inflow.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}`
                      : ''}
                  </Text>
                  <Text style={[styles.tableCellAmt, styles.right]}>
                    {row.outflow
                      ? `¥${row.outflow.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}`
                      : ''}
                  </Text>
                  <Text style={[styles.tableCellAmt, styles.right]}>
                    {net !== 0
                      ? `¥${net.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}`
                      : ''}
                  </Text>
                </View>
              );
            })}

            <View style={styles.tableFooterLine} />

            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLedger, styles.totalLabel]}>
                TOTAL
              </Text>
              <Text
                style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
              >
                ¥{cashFlow.totalIn.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
              <Text
                style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
              >
                ¥{cashFlow.totalOut.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
              <Text
                style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
              >
                ¥{cashFlow.net.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* LEDGER ANALYSIS (FUNCTIONAL) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ledger Analysis (Top 10 by Turnover)</Text>
        <Text style={styles.sectionHint}>
          Turnover and closing balances for busy ledgers ({periodLabel})
        </Text>

        {ledgerAnalysis.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No ledger movement in this period.</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellLedger, styles.tableHeaderText]}>
                Ledger
              </Text>
              <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
                Turnover
              </Text>
              <Text style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}>
                Closing
              </Text>
            </View>

            {ledgerAnalysis.map((row: LedgerAnalysisRow) => (
              <View key={row.ledgerId} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.tableCellLedger}>{row.name}</Text>
                  <Text style={styles.ledgerGroupText}>{row.groupName}</Text>
                </View>
                <Text style={[styles.tableCellAmt, styles.right]}>
                  ¥{row.turnover.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={[styles.tableCellAmt, styles.right]}>
                  {row.closing > 0 && row.closingType
                    ? `¥${row.closing.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })} ${row.closingType}`
                    : ''}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Planned Reports (visual same, just text slightly more generic) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planned Reports</Text>
        <View style={styles.reportGrid}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Profit & Loss</Text>
            <Text style={styles.reportText}>
              More detailed P&L formats with schedules (Sales, Purchases, etc).
            </Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Balance Sheet</Text>
            <Text style={styles.reportText}>
              Full classified Balance Sheet with group-wise breakdown.
            </Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Cash Flow</Text>
            <Text style={styles.reportText}>
              Advanced cash flow (Operating / Investing / Financing) in future.
            </Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Ledger Analysis</Text>
            <Text style={styles.reportText}>
              Graphs and trends for each major ledger over time.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  modesRow: {
    flexDirection: 'row',
    marginVertical: 12,
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  modeChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  section: {
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 8,
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tableCellLedger: {
    flex: 2,
    fontSize: 13,
    color: COLORS.dark,
  },
  tableCellAmt: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  right: {
    textAlign: 'right',
  },
  tableFooterLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: 4,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalAmount: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyBox: {
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  // P&L layout
  plColumnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  plColumn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fdf9ff',
    padding: 8,
  },
  plColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  plRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  plName: {
    fontSize: 12,
    color: COLORS.dark,
    flex: 1,
  },
  plAmountRight: {
    fontSize: 12,
    color: COLORS.dark,
    textAlign: 'right',
    marginLeft: 8,
  },
  plTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  plTotalAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  plNetRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plNetRowLoss: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plNetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
  },
  plNetAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Balance Sheet layout
  bsColumnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bsColumn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f7fbff',
    padding: 8,
  },
  bsColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 4,
  },
  bsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  bsName: {
    fontSize: 12,
    color: COLORS.dark,
    flex: 1,
  },
  bsAmountRight: {
    fontSize: 12,
    color: COLORS.dark,
    textAlign: 'right',
    marginLeft: 8,
  },
  bsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bsTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  bsTotalAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  ledgerGroupText: {
    fontSize: 10,
    color: COLORS.muted,
  },

  // Planned reports
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportCard: {
    flexBasis: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  reportText: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
