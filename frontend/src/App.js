const { useState, useEffect } = React;
const API_BASE_URL = "http://127.0.0.1:8001";

function DynamicPlantForm({ plantId }) {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/schema/${plantId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Failed to load schema");
        }
        return data;
      })
      .then((data) => {
        setSchema(Array.isArray(data.fields) ? data.fields : []);
        setFormData({});
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load schema", err);
        setSchema(null);
        setError(err.message || "Failed to load schema");
      });
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

  if (error) {
    return <p style={{ color: "crimson" }}>Error: {error}</p>;
  }

  if (schema === null) {
    return <p>Loading secure form...</p>;
  }

  if (schema.length === 0) {
    return <p>No schema found for this plant yet.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", marginTop: "20px" }}>
      {schema.map((field) => (
        <div key={field.name} style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>{field.label}</label>
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
  );
}

function App() {
  const [selectedPlant, setSelectedPlant] = useState(1);

  return (
    <div style={{ fontFamily: "Arial", maxWidth: "600px", margin: "50px auto" }}>
      <h1>Factory Command Center</h1>
      <p>Select your plant to enter production data:</p>
      <button onClick={() => setSelectedPlant(1)} style={{ marginRight: "10px", padding: "10px" }}>
        Corrugator Plant (Plant 1)
      </button>
      <button onClick={() => setSelectedPlant(2)} style={{ padding: "10px" }}>
        Converting Plant (Plant 2)
      </button>
      <DynamicPlantForm plantId={selectedPlant} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
