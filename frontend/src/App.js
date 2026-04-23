const { useState, useEffect } = React;
const API_BASE_URL = "http://127.0.0.1:8001";

function DynamicPlantForm({ plantId }) {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
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
    return <p style={{ color: "crimson" }}>Error: {error}</p>;
  }

  if (schema === null) {
    return <p>Loading secure form...</p>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {schema.length === 0 ? (
        <p>No schema found for this plant yet.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
          {schema.map((field) => (
            <div key={field.name} style={{ marginBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "5px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: 0 }}>{field.label}</label>
                <button
                  type="button"
                  onClick={() => handleRemoveField(field)}
                  style={{ backgroundColor: "#B91C1C", color: "white", padding: "6px 10px", border: "none", borderRadius: "5px", cursor: "pointer" }}
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
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <button type="submit" style={{ backgroundColor: "#007BFF", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            Submit Production Data
          </button>
        </form>
      )}

      <div style={{ border: "1px dashed #999", padding: "16px", borderRadius: "8px", marginTop: "16px", backgroundColor: "#fafafa" }}>
        {!isAddingField ? (
          <button
            type="button"
            onClick={() => setIsAddingField(true)}
            style={{ backgroundColor: "#111827", color: "white", padding: "10px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            + Add New Data Field
          </button>
        ) : (
          <form onSubmit={handleAddNewField}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Field Label</label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., Shift Temperature"
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Data Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              >
                <option value="number">Number</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ backgroundColor: "#0F766E", color: "white", padding: "10px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Save Field
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingField(false);
                  setNewField({ name: "", label: "", type: "number" });
                }}
                style={{ backgroundColor: "#9CA3AF", color: "white", padding: "10px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}
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
    <div style={{ border: "1px solid #444", padding: "20px", borderRadius: "8px", marginTop: "30px", backgroundColor: "#f9f9f9" }}>
      <h2 style={{ marginTop: 0 }}>Factory AI Assistant</h2>

      <div style={{ height: "220px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", marginBottom: "10px", backgroundColor: "#fff", borderRadius: "6px" }}>
        {chatLog.length === 0 && <p style={{ margin: 0, color: "#666" }}>Ask about plant schemas, production trends, or submitted metrics.</p>}
        {chatLog.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === "user" ? "right" : "left", margin: "10px 0" }}>
            <span
              style={{
                backgroundColor: msg.sender === "user" ? "#007BFF" : "#E2E3E5",
                color: msg.sender === "user" ? "white" : "black",
                padding: "8px 12px",
                borderRadius: "15px",
                display: "inline-block",
                maxWidth: "85%"
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && <div style={{ textAlign: "left", color: "#555" }}><i>Agent is analyzing the database...</i></div>}
      </div>

      <form onSubmit={handleAsk} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What schema fields exist for plant 1?"
          style={{ flexGrow: 1, padding: "10px" }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: "10px 20px", backgroundColor: "#28A745", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>
          Ask Data
        </button>
      </form>
    </div>
  );
}

function App() {
  const [selectedPlant, setSelectedPlant] = useState(1);

  return (
    <div style={{ fontFamily: "Arial", maxWidth: "800px", margin: "50px auto" }}>
      <h1>Factory Command Center</h1>
      <p>Select your plant to enter production data:</p>
      <button onClick={() => setSelectedPlant(1)} style={{ marginRight: "10px", padding: "10px" }}>
        Corrugator Plant (Plant 1)
      </button>
      <button onClick={() => setSelectedPlant(2)} style={{ padding: "10px" }}>
        Converting Plant (Plant 2)
      </button>
      <FactoryChatbot />
      <DynamicPlantForm plantId={selectedPlant} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
