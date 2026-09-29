import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Billing, Client } from '@/types';
import { formatRupiah } from '@/lib/utils';

// Font registration (using default fonts for simplicity, you can register custom fonts if needed)

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
    color: '#111827',
  },
  companyInfo: {
    marginTop: 10,
    color: '#6b7280',
  },
  invoiceInfo: {
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

interface InvoicePDFProps {
  billing: Billing;
  client?: Client;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ billing, client }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <View style={styles.companyInfo}>
              <Text>SOSO Creative Hub</Text>
              <Text>hello@soso.co.id</Text>
            </View>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={{ fontWeight: 'bold' }}>{billing.billingNumber}</Text>
            <Text>Date: {new Date(billing.createdAt).toLocaleDateString('id-ID')}</Text>
            <Text>Due Date: {new Date(billing.dueDate).toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
            <Text>{billing.clientName}</Text>
            <Text>{billing.clientEmail}</Text>
            {client?.phone && <Text>{client.phone}</Text>}
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
            <Text>Total Due:</Text>
            <Text>{formatRupiah(billing.grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>Payment can be processed securely via our portal using your Access Code: {billing.accessCode}</Text>
        </View>
      </Page>
    </Document>
  );
};
