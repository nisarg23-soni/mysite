from flask import Flask, request, jsonify, render_template
import json
import os

app = Flask(__name__)

# Define paths for the JSON configuration files
JSON_DIR = "mysite/config/"
PDF_DIR = "mysite/pdfs/"

# Ensure the PDF directory exists
os.makedirs(PDF_DIR, exist_ok=True)

selected_file = None

# Ensure the PDF directory exists
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

def list_available_calculators():
    """List all available calculators by scanning the JSON directory."""
    return [file.split(".json")[0] for file in os.listdir(JSON_DIR) if file.endswith(".json")]

def load_config(calculator_type):
    """Load the JSON configuration for the specified calculator."""
    file_path = os.path.join(JSON_DIR, f"{calculator_type}.json")
    if os.path.exists(file_path):
        with open(file_path, "r") as config_file:
            return json.load(config_file)
    return None

@app.route("/config", methods=["GET"])
def config():
    calculator_type = request.args.get("calculator", selected_file)
    if not calculator_type:
        return jsonify({"error": "Calculator type is required"}), 400
    calculator_config = load_config(calculator_type)
    if calculator_config:
        return jsonify(calculator_config)
    else:
        return jsonify({"error": "Invalid calculator type"}), 400

@app.route("/calculators")
def index():
    global selected_file
    index_val = int(request.args.get("index"))
    files = list_available_calculators()
    selected_file = files[index_val - 1]
    return render_template("index.html", files=selected_file)

@app.route("/")
def cl():
    return render_template("calculatorslist.html")

@app.route("/calculatorcategories")
def cc():
    calculators = list_available_calculators()
    return render_template("calculatorcategories.html", calculators=calculators)

@app.route("/calculate", methods=["POST"])
def calculate():
    calculator_type = request.args.get("calculator", selected_file)
    if not calculator_type:
        return jsonify({"error": "Calculator type is required"}), 400

    calculator_config = load_config(calculator_type)
    if not calculator_config:
        return jsonify({"error": "Invalid calculator type"}), 400

    input_data = request.json if request.json else {}
    results = perform_calculation(calculator_config, input_data)

    return jsonify({
        "results": results["calculation_table"],
        "results2": results["selected_results"],
        "charts_result_for_bar": results["charts_results"],
    })

def perform_calculation(calculator_config, input_data):
    """
    Perform calculation using the provided calculator configuration and input data.
    """
    results = {}
    for variable in calculator_config["variables"]:
        var_name = variable["name"].lower()
        results[var_name] = float(input_data.get(var_name, variable["default"]))

    eval_context = {var["name"][0].upper(): results[var["name"].lower()] for var in calculator_config["variables"]}

    text = {}
    for res_name in calculator_config["results"]:
        formulas = calculator_config.get(res_name, "")
        try:
            text[res_name] = eval(formulas, {}, eval_context)
        except Exception as e:
            print(f"Error evaluating {res_name}: {e}")
            text[res_name] = None

    selected_results = {key: text[key] for key in calculator_config.get("selected_keys", []) if key in text}
    charts_results = {key: text[key] for key in calculator_config.get("chart_keys", []) if key in text}

    calculation_table = []
    if calculator_config.get("general_formula"):
        time_value = int(results.get("time", 1))
        for row_number in range(1, time_value + 1):
            eval_context["T"] = row_number
            row = {}
            for key in calculator_config["results"]:
                formula2 = calculator_config.get(key, "").replace("T", str(row_number))
                try:
                    row[key] = eval(formula2, {}, eval_context)
                except Exception as e:
                    row[key] = f"Error: {e}"
            if not calculator_config.get("not_year_colume", True):
                row["Year"] = row_number
            calculation_table.append(row)

    return {
        "calculation_table": calculation_table,
        "selected_results": selected_results,
        "charts_results": charts_results
    }

if __name__ == "__main__":
    app.run(debug=True)
