import React, { useState } from "react";
import { FaQuestionCircle, FaTimes } from "react-icons/fa";

const faqItems = [
  {
    question: "What is VIVENT?",
    answer: "VIVENT is an online event management platform for students, businesses, and organizers.",
  },
  {
    question: "How can I register on VIVENT?",
    answer: "You can create an account using the Sign Up page.",
  },
  {
    question: "Is VIVENT free to use?",
    answer: "Yes, basic event browsing is free for users.",
  },
  {
    question: "How can I join an event?",
    answer: "Open the event details and click the Register or Join button.",
  },
  {
    question: "Can students participate in events?",
    answer: "Yes, students can participate in job fairs, expos, and educational events.",
  },
  {
    question: "What types of events are available?",
    answer: "Job Fairs, Food Festivals, and Educational Expos.",
  },
  {
    question: "How do I contact event organizers?",
    answer: "You can contact organizers through the Contact section or event details page.",
  },
  {
    question: "Can businesses promote their events on VIVENT?",
    answer: "Yes, businesses can use promotion plans to advertise their events.",
  },
  {
    question: "What are the available promotion plans?",
    answer: "Basic Plan, Standard Plan, and Premium Plan.",
  },
  {
    question: "How do I purchase a promotion plan?",
    answer: "Go to the Business Panel and select your preferred plan.",
  },
  {
    question: "Which social media platforms are supported?",
    answer: "Facebook, Instagram, TikTok, and LinkedIn.",
  },
  {
    question: "Can I see previous event reviews?",
    answer: "Yes, reviews are available in the Previous Events & Reviews section.",
  },
  {
    question: "How can I log in to my account?",
    answer: "Use your email and password on the Login page.",
  },
  {
    question: "What should I do if I forget my password?",
    answer: "Use the Forgot Password option on the login page.",
  },
  {
    question: "Is VIVENT mobile responsive?",
    answer: "Yes, VIVENT works on mobile, tablet, and desktop devices.",
  },
  {
    question: "Can I create multiple events?",
    answer: "Yes, organizers and businesses can create multiple events.",
  },
  {
    question: "How do I update my profile?",
    answer: "Open the profile menu and go to Settings.",
  },
  {
    question: "Can I cancel my event registration?",
    answer: "Yes, registrations can be canceled before the event deadline.",
  },
  {
    question: "How can I contact support?",
    answer: "Use the Contact page or support email.",
  },
  {
    question: "Are payment plans monthly?",
    answer: "Yes, all promotion plans are monthly subscriptions.",
  },
  {
    question: "Is online payment available?",
    answer: "Yes, online payment integration can be used for plans and registrations.",
  },
  {
    question: "Can I view upcoming events?",
    answer: "Yes, upcoming events are shown on the dashboard and calendar.",
  },
  {
    question: "What is included in the Basic Plan?",
    answer: "Basic promotion with limited social media posts.",
  },
  {
    question: "What is included in the Standard Plan?",
    answer: "More social media integrations and additional posts.",
  },
  {
    question: "What is included in the Premium Plan?",
    answer: "Maximum promotion features with LinkedIn integration and advanced reach.",
  },
  {
    question: "Can I share events on social media?",
    answer: "Yes, events can be shared directly on supported platforms.",
  },
  {
    question: "How do reviews help users?",
    answer: "Reviews help users understand event quality and experiences.",
  },
  {
    question: "Can organizers track engagement?",
    answer: "Yes, analytics dashboards show reach, engagement, and growth.",
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, user information is protected through secure authentication systems.",
  },
  {
    question: "Why should I use VIVENT?",
    answer: "VIVENT provides an easy, modern, and centralized solution for managing and promoting events.",
  },
];

const FloatingFAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-[60] inline-flex h-14 items-center gap-3 rounded-full bg-blue-800 px-5 text-sm font-bold text-white shadow-2xl transition duration-300 hover:scale-105 hover:bg-blue-900"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <FaQuestionCircle className="text-lg" />
        Help
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 p-4">
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
            <div className="max-h-[85vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-blue-800 to-blue-900 p-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                    FAQ Questions for VIVENT Website
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Frequently Asked Questions</h2>
                </div>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="max-h-[calc(85vh-96px)] overflow-y-auto p-5">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-800">
                  Question
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">
                  {faqItems[activeIndex].question}
                </h3>
                <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-slate-700">
                  {faqItems[activeIndex].answer}
                </p>

                <div className="mt-5 space-y-3">
                  {faqItems.map((item, index) => (
                    <details
                      className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                      key={item.question}
                      open={index === activeIndex}
                    >
                      <summary
                        className="cursor-pointer list-none text-sm font-bold text-slate-900"
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveIndex(index);
                        }}
                      >
                        {index + 1}. {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingFAQ;
