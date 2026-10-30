import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#001a38] text-gray-300 text-xs border-t-2 border-[#f37021]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 className="text-white font-semibold text-sm mb-2 border-b border-gray-700 pb-1">
              AICTE Grievance Portal
            </h3>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070. Central online monitoring and grievance redressal mechanism for AICTE approved institutions across India.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-2 border-b border-gray-700 pb-1">
              Important Bureaus
            </h3>
            <ul className="space-y-1 text-gray-400 text-[11px]">
              <li>Approval & Affiliation Bureau</li>
              <li>Faculty & Staff Welfare Bureau</li>
              <li>Student Affairs & Anti-Ragging Cell</li>
              <li>Finance & Research Grants Bureau</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-2 border-b border-gray-700 pb-1">
              Helpline & Support
            </h3>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              General Grievances: 011-29581000<br />
              National Anti-Ragging Cell: 1800-180-5522<br />
              Technical Support: itdesk@aicte-india.org
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-2 border-b border-gray-700 pb-1">
              Compliance & Legal
            </h3>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Designed as per Guidelines for Indian Government Websites (GIGW 3.0). Standard Web Content Accessibility Guidelines (WCAG 2.1 AA compliant).
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
          <div>
            © 2026 All India Council for Technical Education (AICTE). All Rights Reserved.
          </div>
          <div className="text-amber-400 font-medium">
            Demonstration prototype — not an official AICTE service.
          </div>
        </div>
      </div>
    </footer>
  );
};
