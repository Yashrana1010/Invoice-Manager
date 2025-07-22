const { z } = require("zod");

const trackingSchema = z.object({
  TrackingCategoryID: z.string().default("e2f2f732-e92a-4f3a-9c4d-ee4da0182a13"),
  Name: z.string().default("Region"),
  Option: z.string().default("North"),
});

const lineItemSchema = z.object({
  ItemCode: z.string().default("item-new"),
  Description: z.string(),
  Quantity: z.string().default("1"),
  UnitAmount: z.string(),
  TaxType: z.string().default("OUTPUT"),
  TaxAmount: z.string().default("0.00"),
  LineAmount: z.string(),
  AccountCode: z.string(),
  Tracking: z.array(trackingSchema).optional().default([])
});

const contactSchema = z.object({
  ContactID: z.string().optional(),
  Name: z.string().optional()
}).refine(data => data.ContactID || data.Name, {
  message: "Either ContactID or Name must be provided",
  path: ["Contact"]
});

const xeroInvoiceSchema = z.object({
  Type: z.literal("ACCREC").default("ACCREC"),
  Contact: contactSchema,  // Ensure 'Contact' is not undefined
  DateString: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).default(
    new Date().toISOString().split(".")[0] + "Z"
  ),
  DueDateString: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).default(
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split(".")[0] + "Z"
  ),
  ExpectedPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).default(
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split(".")[0] + "Z"
  ),
  InvoiceNumber: z.string(),
  Reference: z.string().optional().default(""),
  BrandingThemeID: z.string().default("34efa745-7238-4ead-b95e-1fe6c816adbe"),
  Url: z.string().url().default("https://example.com/invoice"),
  CurrencyCode: z.string().length(3).default("INR"),
  Status: z.string().default("SUBMITTED"),
  LineAmountTypes: z.string().default("Inclusive"),
  SubTotal: z.string().default("0.00"),
  TotalTax: z.string().default("0.00"),
  Total: z.string().default("0.00"),
  LineItems: z.array(lineItemSchema).default([])
});

module.exports = { xeroInvoiceSchema };