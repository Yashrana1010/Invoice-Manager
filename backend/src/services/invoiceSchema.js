const { z } = require("zod");

const trackingSchema = z.object({
  TrackingCategoryID: z.string().default("e2f2f732-e92a-4f3a-9c4d-ee4da0182a13"),
  Name: z.string().default("Region"),
  Option: z.string().default("North"),
});

const lineItemSchema = z.object({
  ItemCode: z.string().default("item-new"),
  Description: z.string().default("Invoice item"),
  Quantity: z.string().default("1"),
  UnitAmount: z.string().default("0.00"),
  TaxType: z.string().default("OUTPUT"),
  TaxAmount: z.string().default("0.00"),
  LineAmount: z.string().default("0.00"),
  AccountCode: z.string().default("200"),
  Tracking: z.array(trackingSchema).optional().default([])
});

const contactSchema = z.object({
  ContactID: z.string().optional().default(""),
  Name: z.string().optional().default("Unknown Client")
}).refine(data => data.ContactID || data.Name, {
  message: "Either ContactID or Name must be provided",
  path: ["Contact"]
});

const xeroInvoiceSchema = z.object({
  Contact: contactSchema.default({ Name: "Unknown Client" }),
  DateString: z.string().default("1970-01-01"),
  DueDateString: z.string().default("1970-01-01"),
  ExpectedPaymentDate: z.string().default("1970-01-01"),
  InvoiceNumber: z.string().default("INV-0000"),
  Reference: z.string().optional().default(""),
  BrandingThemeID: z.string().default("34efa745-7238-4ead-b95e-1fe6c816adbe"),
  Url: z.string().url().default("https://example.com/invoice"),
  CurrencyCode: z.string().length(3).default("INR"),
  Status: z.string().default("SUBMITTED"),
  LineAmountTypes: z.string().default("Inclusive"),
  SubTotal: z.string().default("0.00"),
  TotalTax: z.string().default("0.00"),
  Total: z.string().default("0.00"),
  LineItems: z.array(lineItemSchema).default([
    {
      Description: "Invoice item",
      Quantity: "1",
      UnitAmount: "0.00",
      TaxType: "OUTPUT",
      TaxAmount: "0.00",
      LineAmount: "0.00",
      AccountCode: "200",
      Tracking: []
    }
  ])
});

module.exports = { xeroInvoiceSchema };