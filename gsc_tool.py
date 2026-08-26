"""
Felek Mangalbaşı — Google Search Console & Reporting Tool
Delegates to report_tool.py for unified reporting and indexing.
"""
from report_tool import (
    run_comprehensive_analytics,
    send_indexing_requests,
    send_telegram_summary
)
import sys

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--indexing":
        send_indexing_requests()
    elif len(sys.argv) > 1 and sys.argv[1] == "--telegram":
        run_comprehensive_analytics(days=30, send_telegram=True)
    else:
        run_comprehensive_analytics(days=30, send_telegram=False)
