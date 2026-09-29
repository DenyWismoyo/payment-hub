import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Billing, Client } from '@/types';
import { formatRupiah } from '@/lib/utils';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#15803d', // Green to signify paid
  },
  companyInfo: {
    marginTop: 10,
    color: '#6b7280',
  },
  receiptInfo: {
    textAlign: 'right',
  },
  section: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billTo: {
    width: '50%',
  },
  paymentInfo: {
    width: '40%',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 5,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  col1: { width: '50%' },
  col2: { width: '25%', textAlign: 'right' },
  col3: { width: '25%', textAlign: 'right' },
  totals: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    marginBottom: 5,
  },
  grandTotal: {
    fontWeight: 'bold',
    fontSize: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
  },
});

interface ReceiptPDFProps {
  billing: Billing;
  client?: Client;
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ billing, client }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>OFFICIAL RECEIPT</Text>
            <View style={styles.companyInfo}>
              <Text>SOSO Creative Hub</Text>
              <Text>hello@soso.co.id</Text>
            </View>
          </View>
          <View style={styles.receiptInfo}>
            <Text style={{ fontWeight: 'bold' }}>RCT-{billing.billingNumber.replace("INV-", "")}</Text>
            <Text>Date Paid: {billing.paidAt ? new Date(billing.paidAt).toLocaleDateString('id-ID') : '-'}</Text>
            <Text>Invoice Ref: {billing.billingNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Received From:</Text>
            <Text>{billing.clientName}</Text>
            <Text>{billing.clientEmail}</Text>
            {client?.phone && <Text>{client.phone}</Text>}
          </View>
          <View style={styles.paymentInfo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, color: '#15803d' }}>PAYMENT DETAILS</Text>
            <Text>Status: PAID IN FULL</Text>
            <Text>Method: {billing.paymentMethod || 'Unknown'}</Text>
            <Text>Channel: {billing.paymentChannel || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Item Description</Text>
            <Text style={styles.col2}>Amount</Text>
            <Text style={styles.col3}>Total</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.col1}>{billing.catalogItemName}</Text>
            <Text style={styles.col2}>{formatRupiah(billing.subtotal)}</Text>
            <Text style={styles.col3}>{formatRupiah(billing.subtotal)}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatRupiah(billing.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax:</Text>
            <Text>{formatRupiah(billing.taxTotal)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total Paid:</Text>
            <Text>{formatRupiah(billing.grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>This receipt is generated automatically and is valid without a signature.</Text>
        </View>
      </Page>
    </Document>
  );
};
