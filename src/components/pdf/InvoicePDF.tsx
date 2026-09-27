import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";

const formatDate = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return "-";
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#111',
  },
  billingNo: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  companyInfo: {
    color: '#666',
    marginTop: 4,
    lineHeight: 1.4,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  clientBox: {
    flex: 1,
    paddingRight: 20,
  },
  infoTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111',
  },
  clientOrg: {
    color: '#666',
    marginTop: 2,
  },
  clientEmail: {
    color: '#666',
    marginTop: 2,
  },
  metaBox: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    width: '50%',
    marginBottom: 15,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 8,
    marginBottom: 10,
  },
  colDesc: {
    flex: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  colAmount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemDesc: {
    flex: 3,
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemNotes: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  itemAmount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#111',
    paddingTop: 10,
    marginTop: 10,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    textAlign: 'center',
    color: '#666',
    fontSize: 9,
  }
});

export const InvoicePDF = ({ billing }: { billing: Billing }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.billingNo}>{billing.billingNumber}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.companyName}>SOSO Creative Hub</Text>
          <Text style={styles.companyInfo}>Jl. Contoh Alamat No. 123</Text>
          <Text style={styles.companyInfo}>Surakarta, Jawa Tengah</Text>
          <Text style={styles.companyInfo}>info@sosocreative.com</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.clientBox}>
          <Text style={styles.infoTitle}>Ditagihkan Kepada</Text>
          <Text style={styles.clientName}>{billing.clientName}</Text>
          <Text style={styles.clientOrg}>{billing.clientOrganization || "-"}</Text>
          <Text style={styles.clientEmail}>{billing.clientEmail}</Text>
        </View>
        <View style={styles.metaBox}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tanggal Terbit</Text>
            <Text style={styles.metaValue}>{formatDate(billing.issuedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Jatuh Tempo</Text>
            <Text style={styles.metaValue}>{formatDate(billing.dueDate)}</Text>
          </View>
          <View style={[styles.metaItem, { width: '100%' }]}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={[styles.metaValue, { color: billing.status === 'paid' ? '#059669' : '#d97706' }]}>
              {billing.status === 'paid' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Deskripsi Layanan</Text>
          <Text style={styles.colAmount}>Jumlah</Text>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.itemDesc}>
            <Text>{billing.catalogItemName}</Text>
            {billing.notes && <Text style={styles.itemNotes}>{billing.notes}</Text>}
          </View>
          <Text style={styles.itemAmount}>{formatRupiah(billing.subtotal)}</Text>
        </View>
      </View>

      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatRupiah(billing.subtotal)}</Text>
          </View>
          {billing.taxDetails && billing.taxDetails.map((tax, i) => (
            <View key={i} style={styles.totalRow}>
              <Text style={styles.totalLabel}>{tax.name}</Text>
              <Text style={styles.totalValue}>{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</Text>
            </View>
          ))}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Tagihan</Text>
            <Text style={styles.grandTotalValue}>{formatRupiah(billing.grandTotal)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Terima kasih atas kepercayaan Anda.</Text>
        <Text>Pembayaran dapat dilakukan melalui tautan: {billing.mayarPaymentUrl || "Belum tersedia"}</Text>
      </View>
    </Page>
  </Document>
);
