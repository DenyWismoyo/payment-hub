import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";

// Format date
const formatDate = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return "-";
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  clientBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemLabel: {
    color: '#4b5563',
  },
  itemValue: {
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
  }
});

export const ReceiptPDF = ({ billing }: { billing: Billing }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>BUKTI PEMBAYARAN</Text>
        <Text style={styles.subtitle}>Terima kasih, pembayaran Anda telah berhasil kami terima.</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>No. Tagihan</Text>
          <Text style={styles.value}>{billing.billingNumber}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Tanggal Pembayaran</Text>
          <Text style={styles.value}>{formatDate(billing.paidAt)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Metode</Text>
          <Text style={styles.value}>
            {billing.paymentMethod ? billing.paymentMethod.toUpperCase() : "-"} {billing.paymentChannel ? `(${billing.paymentChannel.toUpperCase()})` : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Detail Klien</Text>
      <View style={styles.clientBox}>
        <Text style={styles.clientName}>{billing.clientName}</Text>
        <Text style={styles.itemLabel}>{billing.clientEmail}</Text>
      </View>

      <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
      <View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>{billing.catalogItemName}</Text>
          <Text style={styles.itemValue}>{formatRupiah(billing.subtotal)}</Text>
        </View>
        
        {billing.taxDetails && billing.taxDetails.map((tax, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{tax.name} ({tax.percentage}%)</Text>
            <Text style={styles.itemValue}>{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Dibayar</Text>
          <Text style={styles.totalValue}>{formatRupiah(billing.grandTotal)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Dokumen ini adalah bukti pembayaran yang sah.</Text>
        <Text>Diterbitkan secara otomatis oleh sistem SOSO Creative Hub.</Text>
      </View>
    </Page>
  </Document>
);
