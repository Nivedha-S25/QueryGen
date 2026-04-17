/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Search, Terminal, AlertCircle, Loader2, Table as TableIcon, Code2 } from "lucide-react";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [question, setQuestion] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompt = `
    You are an expert in converting English questions to SQL query!
    The SQL database has the name EMPLOYEES and has the following columns - NAME, DEPARTMENT, ROLE, and SALARY.
    
    For example:
    Example 1 - How many records are present?, 
    the SQL command will be: SELECT COUNT(*) FROM EMPLOYEES;
    
    Example 2 - Show me all employees in HR?, 
    the SQL command will be: SELECT * FROM EMPLOYEES where DEPARTMENT='HR';
    
    The output should only contain the raw SQL code string without any extra text, markdown backticks, or formatting.
  `;

  const handleGenerateAndFetch = async () => {
    if (!question.trim()) {
      setError("Please enter a question first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSqlQuery("");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${prompt}\n\nQuestion: ${question}`,
      });

      const generatedSql = response.text?.trim() || "";
      const cleanedSql = generatedSql.replace(/```sql/g, "").replace(/```/g, "").trim();
      setSqlQuery(cleanedSql);

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: cleanedSql }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to execute query");
      }

      setResults(data.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-sleek-bg text-sleek-text font-sans">
      {/* Sidebar */}
      <aside className="w-[280px] bg-sleek-sidebar border-r border-sleek-border p-6 flex flex-col gap-5 overflow-y-auto shrink-0">
        <div className="flex items-center gap-2 text-2xl font-bold text-sleek-primary mb-2">
          <Code2 className="w-6 h-6" />
          QueryGen
        </div>

        <div className="bg-[#f8f9fb] border border-sleek-border rounded-lg p-4">
          <div className="text-[12px] uppercase tracking-wider text-sleek-muted font-semibold mb-3">Connected Database</div>
          <div className="text-sm font-semibold mb-1">data_vault.db</div>
          <div className="text-[12px] text-sleek-muted">SQLite 3.x</div>
        </div>

        <div className="bg-[#f8f9fb] border border-sleek-border rounded-lg p-4">
          <div className="text-[12px] uppercase tracking-wider text-sleek-muted font-semibold mb-3">Table: EMPLOYEES</div>
          <ul className="text-[13px] space-y-2">
            {[
              { name: "NAME", type: "TEXT" },
              { name: "DEPARTMENT", type: "TEXT" },
              { name: "ROLE", type: "TEXT" },
              { name: "SALARY", type: "INTEGER" },
            ].map((col) => (
              <li key={col.name} className="flex justify-between py-1 border-b border-slate-200 last:border-0">
                <span>{col.name}</span>
                <span className="text-[11px] text-sleek-muted font-mono">{col.type}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-4 text-[11px] text-sleek-muted leading-relaxed">
          <strong>Model:</strong> Gemini 3 Flash<br />
          <strong>Status:</strong> <span className="text-[#10b981]">● Online</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 flex flex-col gap-6 overflow-y-auto">
        <header className="mb-2">
          <h1 className="text-[28px] font-semibold mb-1">Natural Language Query</h1>
          <p className="text-sleek-muted text-sm">Ask a question about your employee data in plain English.</p>
        </header>

        {/* Input Container */}
        <section className="bg-white rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-sleek-border">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sleek-muted w-4 h-4" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateAndFetch()}
              placeholder="e.g., Show me all employees in Engineering who earn more than 80,000."
              className="w-full pl-11 pr-4 py-3 bg-white border border-sleek-border rounded-lg text-[15px] focus:outline-none focus:ring-1 focus:ring-sleek-primary transition-all"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGenerateAndFetch}
              disabled={loading}
              className="bg-sleek-primary hover:opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-opacity flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                "Execute Query"
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </motion.div>
          )}
        </section>

        {/* Output Section */}
        <AnimatePresence>
          {(sqlQuery || results) && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex-1 flex flex-col gap-4 min-h-0"
            >
              {/* SQL Preview */}
              {sqlQuery && (
                <div className="bg-sleek-code text-[#9cdcfe] p-4 rounded-lg font-mono text-[13px] relative group">
                  <span className="absolute top-2 right-3 text-[10px] text-[#666] uppercase tracking-wider">Generated SQL</span>
                  <div className="overflow-x-auto whitespace-pre-wrap pr-20">
                    {sqlQuery}
                  </div>
                </div>
              )}

              {/* Results Table */}
              {results && (
                <div className="bg-white rounded-xl border border-sleek-border overflow-hidden flex flex-col shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[14px]">
                      <thead>
                        <tr className="bg-[#f8f9fb] border-b border-sleek-border">
                          {results.length > 0 && Object.keys(results[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-[12px] font-semibold text-sleek-muted uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0f0]">
                        {results.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-4 py-3 text-sleek-text">
                                {typeof val === "number" && val > 1000 ? (
                                  <span className="bg-[#eef2ff] text-[#4f46e5] px-2 py-0.5 rounded text-[11px] font-semibold">
                                    ${val.toLocaleString()}
                                  </span>
                                ) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {results.length === 0 && (
                    <div className="p-10 text-center text-sleek-muted italic text-sm bg-white">
                      No records found for this query.
                    </div>
                  )}
                  <div className="p-3 px-4 border-t border-[#f0f0f0] text-[12px] text-sleek-muted bg-white">
                    Showing {results.length} result{results.length !== 1 ? 's' : ''} for query execution.
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
