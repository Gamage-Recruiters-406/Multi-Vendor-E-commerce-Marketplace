import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Check,
  AlertCircle,
  Activity,
  Search,
  Send,
  Edit,
  Eye,
  Clock,
  Download,
} from "lucide-react";

import AdminLayout from "../../components/Layouts/AdminLayout";
import {
  getVendorSessions,
  vendorReplyToBuyer,
} from "../../api/chatbotService";

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

const mapSessionToQuestion = (session) => {
  const userQuestion = session.messages?.find((m) => m.sender === "user");

  const vendorAnswer = [...(session.messages || [])]
    .reverse()
    .find((m) => m.sender === "vendor");

  return {
    id: session._id || session.sessionId,
    sessionId: session.sessionId,
    sku: session.productId?._id?.slice(-6)?.toUpperCase() || "NO-SKU",
    status: vendorAnswer ? "Answered" : "Pending",
    product: session.productId?.name || "Unknown Product",
    buyer:
      session.userId?.fullname ||
      session.userId?.name ||
      session.userId?.email ||
      "Unknown Buyer",
    time: formatTime(session.updatedAt || session.createdAt),
    question: userQuestion?.message || "No question found",
    answer: vendorAnswer?.message || "",
  };
};

export default function VendorQAManagement() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);

        const res = await getVendorSessions();
        const sessions = res?.sessions || res?.data || [];

        setQuestions(sessions.map(mapSessionToQuestion));
      } catch (error) {
        console.error("Vendor Q&A load error:", error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const sendReply = async () => {
    try {
      if (!replyMessage.trim() || !selectedSession) return;

      await vendorReplyToBuyer({
        sessionId: selectedSession.sessionId,
        message: replyMessage,
      });

      setQuestions((prev) =>
        prev.map((q) =>
          q.sessionId === selectedSession.sessionId
            ? {
                ...q,
                status: "Answered",
                answer: replyMessage,
              }
            : q,
        ),
      );

      setReplyMessage("");
      setSelectedSession(null);
      alert("Reply sent successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to send reply");
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchFilter = filter === "All" || q.status === filter;
      const searchText = search.toLowerCase();

      const matchSearch =
        q.product.toLowerCase().includes(searchText) ||
        q.sku.toLowerCase().includes(searchText) ||
        q.buyer.toLowerCase().includes(searchText) ||
        q.question.toLowerCase().includes(searchText);

      return matchFilter && matchSearch;
    });
  }, [questions, filter, search]);

  const total = questions.length;
  const answered = questions.filter((q) => q.status === "Answered").length;
  const pending = questions.filter((q) => q.status === "Pending").length;
  const responseRate = total ? Math.round((answered / total) * 100) : 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 md:px-6 md:py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-emerald-700 sm:text-2xl">
              Q&A Management
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Review and respond to customer inquiries across your product
              catalog
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
              <Download size={15} />
              Export
            </button>

            <button className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              <Check size={15} />
              Mark all read
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="Total Questions"
            value={total}
            color="emerald"
          />
          <StatCard
            icon={Check}
            label="Answered"
            value={answered}
            color="emerald"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Response"
            value={pending}
            color="red"
          />
          <StatCard
            icon={Activity}
            label="Response Rate"
            value={`${responseRate}%`}
            color="blue"
          />
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, product name, buyer or question..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Answered", "Pending"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    filter === item
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item}
                </button>
              ))}

              <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                Sort: Latest first
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">
              Loading questions...
            </div>
          ) : filteredQuestions.length > 0 ? (
            filteredQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                item={q}
                onAnswer={() => setSelectedSession(q)}
              />
            ))
          ) : (
            <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">
              No Q&A sessions found.
            </div>
          )}
        </div>
      </div>

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Reply to Customer
            </h2>

            <p className="mb-3 text-sm text-slate-500">
              {selectedSession.question}
            </p>

            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply..."
              className="h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
            />

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setReplyMessage("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={sendReply}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-600",
  };

  const barColor =
    color === "red"
      ? "bg-red-500"
      : color === "blue"
        ? "bg-blue-500"
        : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 ${styles[color]}`}>
          <Icon size={22} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            {value}
          </h2>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">
            {label}
          </p>
        </div>
      </div>

      <div className="mt-4 h-1 rounded-full bg-slate-100">
        <div
          className={`h-1 rounded-full ${barColor}`}
          style={{ width: "55%" }}
        />
      </div>
    </div>
  );
}

function QuestionCard({ item, onAnswer }) {
  const answered = item.status === "Answered";

  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${
        answered ? "border-emerald-500" : "border-red-400"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:flex">
          <MessageSquare size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {item.sku}
            </span>

            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                answered
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {item.status}
            </span>
          </div>

          <h3 className="truncate text-sm font-bold text-slate-800">
            {item.product}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {item.buyer} · {item.time}
          </p>
        </div>
      </div>

      <div className="rounded-xl border-l-4 border-emerald-500 bg-slate-50 p-4">
        <p className="mb-2 text-[11px] font-bold uppercase text-emerald-600">
          Customer Question
        </p>
        <p className="text-sm leading-6 text-slate-600">"{item.question}"</p>
      </div>

      {answered && (
        <div className="mt-3 rounded-xl bg-slate-100 p-4">
          <p className="mb-2 text-[11px] font-bold uppercase text-emerald-600">
            Your Response
          </p>
          <p className="text-sm leading-6 text-slate-600">"{item.answer}"</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          {answered ? (
            <>
              <Check size={14} className="text-emerald-600" />
              Visible to buyers
            </>
          ) : (
            <>
              <Clock size={14} />
              Awaiting response
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
            <Eye size={13} className="inline" /> View
          </button>

          <button
            onClick={onAnswer}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              answered
                ? "border border-blue-200 text-blue-600"
                : "bg-emerald-600 text-white"
            }`}
          >
            {answered ? (
              <>
                <Edit size={13} className="inline" /> Edit
              </>
            ) : (
              <>
                <Send size={13} className="inline" /> Answer now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
