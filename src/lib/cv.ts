/**
 * The three CV PDFs, by purpose.
 *
 * One list because two consumers need the same paths for different reasons: the /cv
 * page appends a content hash (`?v=<sha256[:12]>`) so a replaced document is a new
 * cache key, while the sitemap must use the **bare** URL — a query string is cache
 * machinery, not document identity, and a crawler should see one canonical document
 * URL per PDF. Keeping the paths here stops the two from drifting apart when a file
 * is renamed.
 */
export const CV_PDFS = {
  general: "/cv/Sushant_Poudel_CV.pdf",
  aiSecurity: "/cv/Sushant_Poudel_CV_AISecurity.pdf",
  university: "/cv/Sushant_Poudel_University_Resume.pdf",
} as const;

export const CV_PDF_PATHS: string[] = Object.values(CV_PDFS);
