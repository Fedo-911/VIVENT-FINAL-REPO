import React, { useEffect } from "react";

const policySections = [
  {
    heading: "1. Information We Collect",
    body: "When users create an account or use the platform, VIVENT may collect personal information such as name, email address, account type, profile details, event registrations, and payment-related information required to provide platform services.",
  },
  {
    heading: "2. How We Use Your Information",
    body: "The collected information is used to create user accounts, manage event registrations, process promotional plans, improve platform functionality, provide customer support, and deliver important notifications related to events and user activities.",
  },
  {
    heading: "3. Event and Registration Information",
    body: "Information submitted during event creation or event registration is stored to manage participant records, event details, schedules, and related services. This information is only used for operating the platform effectively.",
  },
  {
    heading: "4. Business Information",
    body: "Businesses using VIVENT may provide company details, event information, promotional plans, and advertisement preferences. This information is used to manage business events and promotional services available on the platform.",
  },
  {
    heading: "5. Payment Information",
    body: "Payment details are processed only for event registrations or promotional plans. VIVENT does not intentionally store sensitive payment credentials beyond what is required to complete authorized transactions.",
  },
  {
    heading: "6. Data Security",
    body: "Reasonable technical and administrative measures are implemented to help protect user information from unauthorized access, modification, or misuse. Users are also responsible for keeping their account credentials secure.",
  },
  {
    heading: "7. Information Sharing",
    body: "VIVENT does not sell or rent users' personal information to third parties. Information may only be shared when required to provide platform services, complete transactions, comply with legal obligations, or protect the security of the system.",
  },
  {
    heading: "8. User Responsibilities",
    body: "Users are responsible for providing accurate information during registration and for updating their account details whenever necessary. They should also protect their login credentials and report any unauthorized account activity.",
  },
  {
    heading: "9. Cookies and Website Usage",
    body: "VIVENT may use cookies or similar technologies to improve website performance, remember user preferences, and enhance the browsing experience. These technologies do not collect unnecessary personal information.",
  },
  {
    heading: "10. Data Retention",
    body: "User information is retained only for as long as it is necessary to provide platform services, maintain system records, resolve disputes, or comply with applicable legal requirements.",
  },
  {
    heading: "11. Changes to This Privacy Policy",
    body: "This Privacy Policy may be updated periodically to reflect improvements, new features, or changes in legal or operational requirements. Updated versions will become effective once published on the VIVENT website.",
  },
  {
    heading: "12. Contact Us",
    body: "If you have any questions or concerns regarding this Privacy Policy or the handling of your information, you can contact the VIVENT team through the Contact page available on the website.",
  },
];

const metaDescription =
  "Read the VIVENT Privacy Policy to understand how we collect, use, store, and protect your personal information while using our event management platform.";

const PrivacyPolicy = () => {
  useEffect(() => {
    const previousTitle = document.title;
    const metaTag = document.querySelector('meta[name="description"]');
    const previousDescription = metaTag?.getAttribute("content");
    const descriptionTag = metaTag || document.createElement("meta");

    document.title = "Privacy Policy | VIVENT";
    descriptionTag.setAttribute("name", "description");
    descriptionTag.setAttribute("content", metaDescription);

    if (!metaTag) {
      document.head.appendChild(descriptionTag);
    }

    return () => {
      document.title = previousTitle;

      if (previousDescription) {
        descriptionTag.setAttribute("content", previousDescription);
      } else if (!metaTag) {
        descriptionTag.remove();
      }
    };
  }, []);

  return (
    <main className="bg-blue-50 px-4 py-12 text-slate-700 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-white p-6 shadow-xl sm:p-10">
        <header className="border-b border-blue-100 pb-8 text-center sm:pb-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-700">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-black text-blue-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
            Learn how VIVENT collects, uses, stores, and protects your
            information.
          </p>
        </header>

        <section
          aria-labelledby="privacy-policy-content"
          className="mx-auto mt-8 max-w-3xl space-y-8 text-left sm:mt-10"
        >
          <article className="rounded-2xl bg-blue-50/70 p-5 sm:p-6">
            <h2
              className="text-2xl font-bold text-blue-900"
              id="privacy-policy-content"
            >
              Privacy Policy
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              At VIVENT, we value the privacy of our users and are committed to
              protecting the personal information shared through our platform.
              This Privacy Policy explains how information is collected, used,
              stored, and protected while using VIVENT.
            </p>
          </article>

          {policySections.map((section) => (
            <article
              className="border-t border-blue-100 pt-8 first:border-t-0 first:pt-0"
              key={section.heading}
            >
              <h2 className="text-xl font-bold text-blue-900">
                {section.heading}
              </h2>
              <p className="mt-3 leading-7 text-slate-700">{section.body}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
