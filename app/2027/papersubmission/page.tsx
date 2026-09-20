"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaEnvelope } from "react-icons/fa6";
import { images } from "@/constants/2027/cloudinary_images";
import {
  SUBMISSION_INSTRUCTIONS,
  TOPICS_OF_INTEREST,
  IMPORTANT_POINTS,
} from "@/constants/2027/paperSubmission";
import BackButton from "@/components/2027/BackButton";
import CustomToast from "@/components/2027/CustomToast";
import SubmissionPannel from "@/components/2027/paper_submission/SubmissionPannel";
import TopicCard from "@/components/2027/paper_submission/TopicCard";

// Manual portal state control — no date/time automation.
// Precedence: IS_CLOSED > IS_LIVE > upcoming (both false).
const IS_LIVE = true;
const IS_CLOSED = true;

const TOAST_MESSAGES = {
  closed: "The submission portal is now closed.",
  upcoming: "The submission portal has not opened yet.",
  misconfigured: "Submission link is not configured in the environment.",
};

const PaperSubmissionPage = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubButtonClick = () => {
    if (IS_CLOSED) {
      setToastMessage(TOAST_MESSAGES.closed);
      return;
    }

    if (!IS_LIVE) {
      setToastMessage(TOAST_MESSAGES.upcoming);
      return;
    }

    const submissionUrl = process.env.NEXT_PUBLIC_SUBMISSION_URL;

    if (submissionUrl) {
      window.open(submissionUrl, "_blank", "noopener,noreferrer");
    } else {
      setToastMessage(TOAST_MESSAGES.misconfigured);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-paper text-ink px-6 pt-24 pb-24 max-w-7xl mx-auto flex flex-col gap-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <CustomToast
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
        />
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-ink pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink mt-3">
            Paper Submission
          </h1>
        </div>

        <BackButton />
      </div>

      {/* Submission Instructions & Portal Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Instructions */}
        <div className="lg:col-span-2 flex flex-col gap-6 max-w-3xl">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink">
            Submission Instructions
          </h2>
          <div className="prose prose-ink max-w-none text-ink-dim/95 leading-relaxed space-y-5">
            {SUBMISSION_INSTRUCTIONS.paragraphs.map((para, idx) => (
              <p key={idx} className="text-justify">
                {para}
              </p>
            ))}
          </div>
          <hr className="border-t-2 border-ink/10 my-1" />
          {/* Redesigned Publication Block */}
          <div className="flex flex-col sm:flex-row items-end sm:items-start justify-between gap-4">
            <div className="flex flex-col gap-1 w-full">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-dim/60 font-bold">
                Publication
              </span>
              <p className="font-serif text-base leading-snug text-ink text-justify sm:text-left">
                Proceedings of past ICAA conferences were published as part of
                the{" "}
                <a
                  href="https://www.springer.com/gp/computer-science/lncs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sea-700 hover:text-sea-700/80 font-black underline decoration-2 underline-offset-2 transition-colors duration-150"
                >
                  Springer Verlag LNCS
                </a>{" "}
                volume. Proceedings of ICAA 2027 will also be published by
                Springer.
              </p>
            </div>
            <Image
              src={images.springer}
              alt="Springer Logo"
              width={140}
              height={48}
              className="h-12 w-auto object-contain shrink-0 border border-ink bg-white mt-1 self-end sm:self-auto"
            />
          </div>
          <hr className="border-t-2 border-ink/10 my-1" />
        </div>

        {/* Right Column: Portal Control Card */}
        <div className="flex flex-col justify-start">
          <SubmissionPannel
            handleSubButtonClick={handleSubButtonClick}
            isLive={IS_LIVE}
            isClosed={IS_CLOSED}
          />
          {/* Edit Submission Note */}
          <div className="mt-5 border-2 border-ink bg-surface/40 p-4 shadow-[4px_4px_0px_0px_var(--color-ink)] flex items-start gap-3">
            {/* <div className="w-8 h-8 shrink-0 border border-ink bg-chrome-400 flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-ink)]">
              <FaTriangleExclamation className="w-3.5 h-3.5 text-ink" />
            </div> */}
            <p className="text-xs text-ink leading-relaxed font-mono">
              For editing a submission, authors are advised to first delete the
              original file (not the submission) and then upload the fresh file.
            </p>
          </div>
          {/* Dedicated CMT Platform Capsule */}
          <div className="mt-5 border-2 border-ink bg-surface/40 p-4 shadow-[4px_4px_0px_0px_var(--color-ink)] flex items-center justify-between gap-4">
            <span className="font-mono text-xs font-black text-ink uppercase tracking-wider">
              Platform
            </span>
            <div className="relative w-28 h-8">
              <Image
                src={images.cmt}
                alt="Microsoft CMT Logo"
                fill
                sizes="7rem"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Topics of Interest Section */}
      <div className="flex flex-col gap-8 border-t-2 border-ink pt-12">
        <div className="space-y-3">
          <h2 className="font-serif text-3xl font-bold text-ink">
            Topics of Interest
          </h2>
          <p className="text-ink-dim max-w-3xl leading-relaxed">
            We solicit contributions covering various areas including but not
            limited to the following topics:
          </p>
        </div>

        {/* Unified Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOPICS_OF_INTEREST.map((topic, i) => (
            <TopicCard key={i} topic={topic} />
          ))}
        </div>

        <div className="border border-ink bg-surface/40 p-6 shadow-[3px_3px_0px_0px_var(--color-ink)]">
          <span className="font-mono text-xs uppercase tracking-wider font-bold text-ink-dim">
            Note
          </span>
          <p className="mt-3 text-ink-dim text-justify">
            The Microsoft CMT service was used for managing the peer-reviewing
            process for this conference. This service was provided for free by
            Microsoft and they bore all expenses, including costs for Azure
            cloud services as well as for software development and support.
          </p>
        </div>
      </div>

      {/* Important Points Section */}
      <div className="flex flex-col gap-8 border-t-2 border-ink pt-12">
        <h2 className="font-serif text-3xl font-bold text-ink">
          Important Points To Be Noted
        </h2>

        <ol className="flex flex-col gap-5 list-decimal list-inside marker:font-bold marker:text-ink">
          {IMPORTANT_POINTS.map((point, idx) => (
            <li
              key={idx}
              className="text-ink-dim leading-relaxed text-justify pl-1"
            >
              <span className="text-ink">{point.text}</span>
              {point.link && (
                <>
                  {" "}
                  <a
                    href={point.link.url}
                    target={
                      point.link.url.startsWith("mailto:")
                        ? undefined
                        : "_blank"
                    }
                    rel={
                      point.link.url.startsWith("mailto:")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="text-sea-700 hover:text-sea-700/80 font-black underline decoration-2 underline-offset-2 transition-colors duration-150"
                  >
                    {point.link.label}
                  </a>
                  .
                </>
              )}

              {point.subPoints && (
                <ol className="mt-3 flex flex-col gap-2 list-[lower-alpha] list-inside pl-4">
                  {point.subPoints.map((sub, subIdx) => (
                    <li
                      key={subIdx}
                      className="text-ink-dim leading-relaxed text-justify"
                    >
                      {sub.text}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Email Conference Help Desk */}
      <div className="pt-2 flex flex-col items-center gap-4">
        <p className="text-ink-dim text-sm md:text-base leading-relaxed text-center max-w-2xl">
          For assistance, please contact our help desk.
        </p>

        <a
          href="mailto:icaa@heritageit.edu"
          className="group inline-flex items-center gap-2 px-6 py-3 border border-ink bg-chrome-400 text-ink font-mono font-bold text-xs uppercase tracking-widest hover:bg-paper transition-all duration-150 shadow-[3px_3px_0px_0px_var(--color-ink)] hover:shadow-[5px_5px_0px_0px_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none text-center"
        >
          <FaEnvelope className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span>Email Conference Help Desk</span>
        </a>
      </div>
    </div>
  );
};

export default PaperSubmissionPage;
