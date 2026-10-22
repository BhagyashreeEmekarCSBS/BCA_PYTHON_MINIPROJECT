# gui.py
# This class creates the Tkinter window for predicting diabetes.

import tkinter as tk
from tkinter import messagebox, ttk

from disease_detection.record_manager import PatientRecordManager


class DiabetesApp:

    FIELDS = [
        ("Pregnancies", "Number of pregnancies", "count"),
        ("Glucose", "Plasma glucose", "mg/dL"),
        ("BloodPressure", "Blood pressure", "mm Hg"),
        ("SkinThickness", "Skin thickness", "mm"),
        ("Insulin", "Insulin", "mu U/ml"),
        ("BMI", "Body mass index", "kg/m2"),
        ("DiabetesPedigreeFunction", "Diabetes pedigree function", "score"),
        ("Age", "Age", "years"),
    ]

    def __init__(self, predictor):
        self.predictor = predictor
        self.records = PatientRecordManager()
        self.entries = []

        self.window = tk.Tk()
        self.window.title("Disease Pattern Detection - Diabetes Prediction")
        self.window.configure(bg="#f4f7fb")
        self.window.minsize(660, 720)

        self.setup_style()
        self.create_widgets()
        self.center_window()

    def setup_style(self):
        style = ttk.Style(self.window)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        style.configure(
            "Primary.TButton",
            font=("Segoe UI", 10, "bold"),
            padding=(18, 9),
            background="#1f6feb",
            foreground="white",
            borderwidth=0,
        )
        style.map(
            "Primary.TButton",
            background=[("active", "#1558b0"), ("disabled", "#9fb3c8")],
            foreground=[("disabled", "#f0f4f8")],
        )

        style.configure(
            "Secondary.TButton",
            font=("Segoe UI", 10),
            padding=(16, 9),
            background="#e6edf5",
            foreground="#243b53",
            borderwidth=0,
        )
        style.map(
            "Secondary.TButton",
            background=[("active", "#d6e2ee"), ("disabled", "#eef2f7")],
            foreground=[("disabled", "#9fb3c8")],
        )

        style.configure(
            "TEntry",
            fieldbackground="white",
            bordercolor="#cbd5e0",
            lightcolor="#cbd5e0",
            darkcolor="#cbd5e0",
            padding=4,
        )
        style.map("TEntry", bordercolor=[("focus", "#1f6feb")])

        style.configure(
            "Neutral.Horizontal.TProgressbar",
            troughcolor="#e8eef5",
            bordercolor="#e8eef5",
            background="#bcccdc",
            lightcolor="#bcccdc",
            darkcolor="#bcccdc",
        )
        style.configure(
            "Risk.Horizontal.TProgressbar",
            troughcolor="#fbeaea",
            bordercolor="#fbeaea",
            background="#e74c3c",
            lightcolor="#e74c3c",
            darkcolor="#e74c3c",
        )
        style.configure(
            "Safe.Horizontal.TProgressbar",
            troughcolor="#e7f6ec",
            bordercolor="#e7f6ec",
            background="#27ae60",
            lightcolor="#27ae60",
            darkcolor="#27ae60",
        )

    def create_widgets(self):
        main = tk.Frame(self.window, bg="#f4f7fb", padx=26, pady=14)
        main.pack(fill="both", expand=True)

        title = tk.Label(
            main,
            text="Diabetes Prediction System",
            bg="#f4f7fb",
            fg="#12355b",
            font=("Segoe UI", 19, "bold"),
            anchor="w",
        )
        title.pack(fill="x")

        accuracy = round(self.predictor.accuracy * 100, 2)
        subtitle = tk.Label(
            main,
            text="Model accuracy: " + str(accuracy) + "%   |   "
                 "Enter the patient details below to estimate diabetes risk.",
            bg="#f4f7fb",
            fg="#627d98",
            font=("Segoe UI", 10),
            anchor="w",
        )
        subtitle.pack(fill="x", pady=(2, 0))

        form = tk.Frame(
            main,
            bg="white",
            highlightthickness=1,
            highlightbackground="#dbe3ee",
            padx=16,
            pady=6,
        )
        form.pack(fill="x", pady=(14, 0))
        form.columnconfigure(0, weight=1)
        form.columnconfigure(1, weight=1)

        name_cell = tk.Frame(form, bg="white")
        name_cell.grid(row=0, column=0, columnspan=2, sticky="ew", padx=8, pady=4)

        name_head = tk.Frame(name_cell, bg="white")
        name_head.pack(fill="x")

        tk.Label(
            name_head,
            text="Patient name",
            bg="white",
            fg="#243b53",
            font=("Segoe UI", 10, "bold"),
            anchor="w",
        ).pack(side="left")

        tk.Label(
            name_head,
            text="required",
            bg="white",
            fg="#829ab1",
            font=("Segoe UI", 8),
            anchor="e",
        ).pack(side="right")

        self.name_entry = ttk.Entry(name_cell, font=("Segoe UI", 11))
        self.name_entry.pack(fill="x", ipady=2, pady=(3, 0))
        self.name_entry.bind("<Return>", lambda event: self.predict())

        for index, (key, label, unit) in enumerate(self.FIELDS):
            row = index // 2 + 1
            col = index % 2

            cell = tk.Frame(form, bg="white")
            cell.grid(row=row, column=col, sticky="ew", padx=8, pady=4)

            head = tk.Frame(cell, bg="white")
            head.pack(fill="x")

            tk.Label(
                head,
                text=label,
                bg="white",
                fg="#243b53",
                font=("Segoe UI", 10, "bold"),
                anchor="w",
            ).pack(side="left")

            tk.Label(
                head,
                text=unit,
                bg="white",
                fg="#829ab1",
                font=("Segoe UI", 8),
                anchor="e",
            ).pack(side="right")

            entry = ttk.Entry(cell, font=("Segoe UI", 11))
            entry.pack(fill="x", ipady=2, pady=(3, 0))
            entry.bind("<Return>", lambda event: self.predict())
            self.entries.append(entry)

        button_row = tk.Frame(main, bg="#f4f7fb")
        button_row.pack(fill="x", pady=(12, 0))

        predict_btn = ttk.Button(
            button_row,
            text="Predict Diabetes Risk",
            style="Primary.TButton",
            command=self.predict,
        )
        predict_btn.pack(side="left")

        clear_btn = ttk.Button(
            button_row,
            text="Clear",
            style="Secondary.TButton",
            command=self.clear,
        )
        clear_btn.pack(side="left", padx=(10, 0))

        result_card = tk.Frame(
            main,
            bg="white",
            highlightthickness=1,
            highlightbackground="#dbe3ee",
            padx=18,
            pady=10,
        )
        result_card.pack(fill="x", pady=(12, 0))

        self.result_label = tk.Label(
            result_card,
            text="No prediction yet",
            bg="white",
            fg="#627d98",
            font=("Segoe UI", 11),
            anchor="w",
        )
        self.result_label.pack(fill="x")

        self.prob_label = tk.Label(
            result_card,
            text="Chance of diabetes: --",
            bg="white",
            fg="#243b53",
            font=("Segoe UI", 22, "bold"),
            anchor="w",
        )
        self.prob_label.pack(fill="x", pady=(0, 4))

        self.progress = ttk.Progressbar(
            result_card,
            maximum=100,
            style="Neutral.Horizontal.TProgressbar",
        )
        self.progress.pack(fill="x")

        self.verdict_label = tk.Label(
            result_card,
            text="Fill in the patient details above, then click Predict.",
            bg="white",
            fg="#627d98",
            font=("Segoe UI", 10),
            anchor="w",
            wraplength=580,
            justify="left",
        )
        self.verdict_label.pack(fill="x", pady=(6, 0))

        self.status_label = tk.Label(
            result_card,
            text="Each prediction is saved to patient_records.xlsx",
            bg="white",
            fg="#829ab1",
            font=("Segoe UI", 9),
            anchor="w",
            wraplength=580,
            justify="left",
        )
        self.status_label.pack(fill="x", pady=(8, 0))

        footer = tk.Label(
            main,
            text="For educational purposes only. This is not a medical diagnosis.",
            bg="#f4f7fb",
            fg="#9fb3c8",
            font=("Segoe UI", 8),
            anchor="w",
        )
        footer.pack(fill="x", pady=(8, 0))

        self.name_entry.focus_set()

    def center_window(self):
        self.window.update_idletasks()
        width = 680
        height = 750
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        x = max(0, (screen_width - width) // 2)
        y = max(0, (screen_height - height) // 3)
        self.window.geometry(str(width) + "x" + str(height) + "+" + str(x) + "+" + str(y))

    def predict(self):
        name = self.name_entry.get().strip()

        if name == "":
            messagebox.showwarning(
                "Missing name",
                "Please enter the patient's name.",
            )
            self.name_entry.focus_set()
            return

        values = []

        for (key, label, unit), entry in zip(self.FIELDS, self.entries):
            text = entry.get().strip()

            if text == "":
                messagebox.showwarning(
                    "Missing value",
                    "Please enter a value for " + label + ".",
                )
                entry.focus_set()
                return

            try:
                value = float(text)
            except ValueError:
                messagebox.showerror(
                    "Invalid value",
                    label + " must be a number.",
                )
                entry.focus_set()
                entry.select_range(0, tk.END)
                return

            if value < 0:
                messagebox.showerror(
                    "Invalid value",
                    label + " cannot be negative.",
                )
                entry.focus_set()
                entry.select_range(0, tk.END)
                return

            values.append(value)

        result, probability = self.predictor.predict_patient(values)
        probability = round(probability, 2)

        if result == 1:
            color = "#c0392b"
            bar_style = "Risk.Horizontal.TProgressbar"
            verdict = "Prediction: Likely to have Diabetes"
            note = ("The model estimates a higher risk of diabetes. "
                    "Please consult a doctor for a proper medical diagnosis.")
        else:
            color = "#1e8449"
            bar_style = "Safe.Horizontal.TProgressbar"
            verdict = "Prediction: Not likely to have Diabetes"
            note = ("The model estimates a lower risk of diabetes. "
                    "Keep maintaining a healthy lifestyle.")

        self.result_label.config(text=verdict, fg=color)
        self.prob_label.config(
            text="Chance of diabetes: " + format(probability, ".2f") + " %",
            fg=color,
        )
        self.progress.configure(style=bar_style, value=probability)
        self.verdict_label.config(text=note, fg="#486581")

        try:
            saved_path = self.records.save(name, values, result, probability)
            self.status_label.config(
                text="Saved to " + saved_path,
                fg="#1e8449",
            )
        except Exception as error:
            self.status_label.config(
                text="Could not save the record: " + str(error),
                fg="#c0392b",
            )

    def clear(self):
        self.name_entry.delete(0, tk.END)
        for entry in self.entries:
            entry.delete(0, tk.END)

        self.result_label.config(text="No prediction yet", fg="#627d98")
        self.prob_label.config(text="Chance of diabetes: --", fg="#243b53")
        self.progress.configure(value=0, style="Neutral.Horizontal.TProgressbar")
        self.verdict_label.config(
            text="Fill in the patient details above, then click Predict.",
            fg="#627d98",
        )
        self.status_label.config(
            text="Each prediction is saved to patient_records.xlsx",
            fg="#829ab1",
        )

        self.name_entry.focus_set()

    def run(self):
        self.window.mainloop()
