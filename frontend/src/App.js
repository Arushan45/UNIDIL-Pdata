const { useState, useEffect } = React;
const API_BASE_URL =
  window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8001"
    : "https://backend-nine-murex-11.vercel.app";

function DynamicPlantForm({ plantId }) {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState({ name: "", label: "", type: "number" });

  const fetchSchema = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schema/${plantId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to load schema");
      }
      setSchema(Array.isArray(data.fields) ? data.fields : []);
      setFormData({});
      setError("");
    } catch (err) {
      console.error("Failed to load schema", err);
      setSchema(null);
      setError(err.message || "Failed to load schema");
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [plantId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/data/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_id: plantId,
          production_date: productionDate,
          metrics: formData
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Error submitting data");
      }
      alert(result.message || "Submitted");
      setFormData({});
    } catch (err) {
      alert(err.message || "Error submitting data!");
    }
  };

  const handleRemoveField = async (field) => {
    const confirmed = window.confirm(`Remove field "${field.label}" from this plant schema?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/schema/${plantId}/remove-field/${encodeURIComponent(field.name)}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 404 && result.detail === "Not Found") {
          throw new Error("Remove-field API not available. Restart backend on port 8001 and try again.");
        }
        throw new Error(result.detail || "Failed to remove field");
      }

      const updatedFormData = { ...formData };
      delete updatedFormData[field.name];
      setFormData(updatedFormData);
      await fetchSchema();
    } catch (err) {
      alert(err.message || "Failed to remove field");
    }
  };

  const handleAddNewField = async (e) => {
    e.preventDefault();

    const trimmedLabel = newField.label.trim();
    if (!trimmedLabel) {
      alert("Field label is required.");
      return;
    }

    const generatedName = trimmedLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!generatedName) {
      alert("Please use a valid field label.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/schema/${plantId}/add-field`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generatedName,
          label: trimmedLabel,
          type: newField.type
        })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 404 && result.detail === "Not Found") {
          throw new Error("Add-field API not available. Restart backend on port 8001 and try again.");
        }
        throw new Error(result.detail || "Failed to add field");
      }

      setNewField({ name: "", label: "", type: "number" });
      setIsAddingField(false);
      await fetchSchema();
    } catch (err) {
      alert(err.message || "Failed to add field");
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Error: {error}
      </div>
    );
  }

  if (schema === null) {
    return <p className="text-slate-600">Loading secure form...</p>;
  }

  const corrugatorFields = schema.filter((field) => field.name?.includes("corrugator"));
  const tuberFields = schema.filter((field) => field.name?.includes("tuber"));
  const otherFields = schema.filter((field) => !field.name?.includes("corrugator") && !field.name?.includes("tuber"));

  const renderFieldCard = (title, subtitle, fields, accentClass) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${accentClass}`}>
          {fields.length} fields
        </span>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          No fields in this section.
        </p>
      ) : (
        <div className="space-y-3.5 sm:space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">{field.label}</label>
                <button
                  type="button"
                  onClick={() => handleRemoveField(field)}
                  className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1"
                >
                  Remove
                </button>
              </div>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      {schema.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-slate-600 shadow-sm">
          No schema found for this plant yet.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-800">Production Date</label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              required
              className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {renderFieldCard(
              "Corrugator Metrics",
              "Planned, actual, yield, rejections, and stoppages",
              corrugatorFields,
              "bg-blue-100 text-blue-700"
            )}
            {renderFieldCard(
              "Tuber Metrics",
              "Planned, actual, yield, rejections, and stoppages",
              tuberFields,
              "bg-cyan-100 text-cyan-700"
            )}
            {renderFieldCard(
              "Other / General",
              "Printing, finishing, and custom machine fields",
              otherFields,
              "bg-slate-100 text-slate-700"
            )}
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Submit Production Data
          </button>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-gray-100 p-4 shadow-inner sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Builder / Admin Zone</h3>
            <p className="text-xs text-slate-600">Add custom fields to this plant schema.</p>
          </div>
          {!isAddingField && (
            <button
              type="button"
              onClick={() => setIsAddingField(true)}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              + Add New Data Field
            </button>
          )}
        </div>

        {isAddingField && (
          <form onSubmit={handleAddNewField} className="space-y-4 rounded-lg border border-slate-300 bg-white p-3.5 sm:p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Field Label</label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., Shift Temperature"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Data Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="number">Number</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Save Field
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingField(false);
                  setNewField({ name: "", label: "", type: "number" });
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function FactoryChatbot() {
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) {
      return;
    }

    const nextLog = [...chatLog, { sender: "user", text: trimmedQuestion }];
    setChatLog(nextLog);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "AI request failed");
      }

      setChatLog([...nextLog, { sender: "ai", text: result.answer || "No answer returned." }]);
    } catch (err) {
      setChatLog([...nextLog, { sender: "ai", text: err.message || "Connection error with AI brain." }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 sm:text-xl">Factory AI Assistant</h2>

      <div className="mb-4 h-52 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 sm:h-56">
        {chatLog.length === 0 && (
          <p className="text-sm text-slate-500">Ask about plant schemas, production trends, or submitted metrics.</p>
        )}
        <div className="space-y-3">
          {chatLog.map((msg, i) => (
            <div key={i} className={msg.sender === "user" ? "text-right" : "text-left"}>
              <span
                className={
                  msg.sender === "user"
                    ? "inline-block max-w-[85%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white"
                    : "inline-block max-w-[85%] rounded-2xl bg-slate-200 px-3 py-2 text-sm text-slate-800"
                }
              >
                {msg.text}
              </span>
            </div>
          ))}
          {isLoading && <p className="text-sm italic text-slate-500">Agent is analyzing the database...</p>}
        </div>
      </div>

      <form onSubmit={handleAsk} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What schema fields exist for UNIDIL?"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ask Data
        </button>
      </form>
    </div>
  );
}

function App() {
  const [selectedPlant, setSelectedPlant] = useState(3);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5 lg:space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Factory Command Center</h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">Select your plant to enter production data.</p>
          </div>
          <button
            onClick={() => setSelectedPlant(3)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            UNIDIL
          </button>
        </header>

        <FactoryChatbot />
        <DynamicPlantForm plantId={selectedPlant} />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
