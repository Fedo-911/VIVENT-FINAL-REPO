import React from "react";
import { Link } from "react-router-dom";

const TermsOfServices = () => {
  return (
    <div className="bg-blue-50 px-4 py-12 text-slate-700">
      <div className="mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-white p-6 shadow-xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-700">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-black text-blue-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm leading-7 text-gray-500">
          {/* Last updated: August 1, 2026*/} Welcome to VIVENT, an online event management platform designed to connect students, businesses, and event organizers. By accessing or using this website, you agree to follow these Terms of Service. If you do not agree with any part of these terms, you should discontinue using the platform.
        </p>

        <div className="mt-8 space-y-8 text-left">
          <section>
            <h2 className="text-xl font-bold text-blue-900">Acceptance of Terms</h2>
            <p className="mt-3 leading-7">
              By creating an account or using any feature of VIVENT, you acknowledge that you have read, understood, and agreed to these terms and conditions. These terms apply to all users, including visitors, students, businesses, organizers, and administrators.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900">User Accounts</h2>
            <p className="mt-3 leading-7">
              Users are responsible for providing accurate registration information and maintaining the confidentiality of their login credentials. Each account is intended for personal use only, and users must not share their account details with others. Any activity performed through an account is the responsibility of the account owner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900">Use of the Platform</h2>
            <p className="mt-3 leading-7">
              VIVENT provides access to event discovery, event registration, business event promotion, and related services. Users agree to use the platform only for lawful purposes and must not upload misleading, offensive, or unauthorized content. Any attempt to interfere with the normal operation of the platform is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900">Event Registration</h2>
            <p className="mt-3 leading-7">
              Students and other participants may register for available events through the platform. Users are responsible for reviewing event details before completing their registration. Event organizers may update or cancel events when necessary, and participants will receive relevant notifications where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900">Business Services</h2>
            <p className="mt-3 leading-7">
              Businesses may create and manage events and purchase promotional plans to increase event visibility. The information provided for events and advertisements must be accurate and must not violate applicable laws or the rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900">Promotion Plans and Payments</h2>
            <p className="mt-3 leading-7">
              VIVENT offers promotional plans such as Basic, Standard, and Premium. Payments made for promotional services are processed according to the selected plan. Users are encouraged to review plan details before completing any payment.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">User Content</h2>
            <p className="mt-3 leading-7">
              Users remain responsible for any information, images, or event details they submit to the platform. By publishing content on VIVENT, users confirm that they have the necessary rights to share that content and grant the platform permission to display it for system operations.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">Privacy and Data Protection</h2>
            <p className="mt-3 leading-7">
              Personal information collected during registration and platform usage is handled according to the VIVENT{" "}
              <Link
                className="font-semibold text-blue-700 hover:underline"
                to="/privacy-policy"
              >
                Privacy Policy
              </Link>
              . Appropriate security measures are used to protect user data, although no online service can guarantee complete security.
              </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">Administrator Rights</h2>
            <p className="mt-3 leading-7">
             Administrators reserve the right to review, edit, suspend, or remove accounts, events, or other content that violates these terms or affects the security and integrity of the platform.              </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">Service Availability</h2>
            <p className="mt-3 leading-7">
             VIVENT aims to provide reliable service; however, temporary interruptions may occur due to maintenance, updates, or technical issues. The platform may introduce new features or modify existing functionality without prior notice.              </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">Limitation of Liability</h2>
            <p className="mt-3 leading-7">
             VIVENT serves as an event management platform and is not responsible for disputes, losses, or damages arising from interactions between participants, businesses, or event organizers. Users participate in events at their own discretion.              </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">Changes to These Terms</h2>
            <p className="mt-3 leading-7">
             These Terms of Service may be updated periodically to reflect improvements or changes to the platform. Continued use of VIVENT after any updates indicates acceptance of the revised terms.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-blue-900">Contact Information</h2>
            <p className="mt-3 leading-7">
            If you have any questions regarding these Terms of Service, you may contact the VIVENT support team through the Contact page available on the website.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServices;
