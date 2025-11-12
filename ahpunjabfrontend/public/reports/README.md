# Monthly Reports PDF Directory

This directory contains generated PDF reports for monthly submissions.

## File Naming Convention

PDFs should be named in the format: `YYYY-MM-report.pdf`

**Examples:**
- `2024-06-report.pdf` - June 2024 report
- `2024-07-report.pdf` - July 2024 report  
- `2024-08-report.pdf` - August 2024 report

## Usage

When a user clicks the email/download button on a submitted or approved report, 
the system will attempt to download the PDF from this directory.

The expected path format is: `/reports/YYYY-MM-report.pdf`

## Future Implementation

This is a temporary solution. In the future, this will be replaced with:
1. Dynamic PDF generation from report data
2. Backend API endpoint to generate and serve PDFs
3. Email functionality to send PDFs to users
