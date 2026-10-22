# Student Learning Behaviour Analysis System
## Mini Project Report

### 1. Abstract
The Student Learning Behaviour Analysis System is a Python-based project that explores relationships between study habits and academic performance. It uses data analysis, visualization, and unsupervised machine learning to identify groups of students with similar patterns. The system also produces simple academic recommendations based on observable indicators.

### 2. Problem Statement
Educational institutions collect information such as study time, attendance, previous marks, assignment scores, and access to learning resources. Reviewing these factors manually can make it difficult to identify common learning patterns. This project demonstrates a data-driven approach to summarize student data, explore associations, group similar records, and propose support strategies.

### 3. Objectives
- Analyze student academic data.
- Perform exploratory data analysis (EDA).
- Examine correlations between numeric variables.
- Apply K-Means clustering to group students.
- Describe the resulting learning-behaviour profiles.
- Generate understandable academic recommendations.

### 4. Tools and Technologies
- Python 3.11.9
- Pandas: data loading and manipulation
- NumPy: numerical operations (available for extensions)
- Matplotlib and Seaborn: graphs and visualizations
- Scikit-learn: feature scaling and K-Means clustering

### 5. Dataset Description
The supplied `student_performance.csv` contains synthetic demonstration records. Fields include:
- `student_id`: anonymous sample identifier
- `study_hours_per_day`: average study time per day
- `attendance_percent`: attendance percentage
- `previous_marks`: previous academic marks
- `assignment_score`: assignment score
- `final_marks`: final academic marks
- `parent_education_level`: broad category for parental education
- `internet_access`: sample category describing access

The dataset is synthetic, not official or collected from actual students. Results are for demonstrating the method only.

### 6. Methodology
1. Load the CSV file with Pandas and validate the expected columns.
2. Inspect sample rows, descriptive statistics, and missing values.
3. Plot the distribution of final marks.
4. Calculate a correlation matrix and visualize it as a heatmap.
5. Plot study hours against final marks.
6. Standardize selected numeric variables with `StandardScaler`.
7. Apply K-Means with four clusters and a fixed random seed for reproducibility.
8. Summarize average study hours, attendance, and marks for each cluster.
9. Generate simple rule-based recommendations for individual records.
10. Save graphs, cluster results, profiles, and recommendations to the `outputs` folder.

### 7. Expected Outputs
- Summary statistics in the console
- Final marks distribution graph
- Correlation heatmap and correlation matrix CSV
- Study-hours-versus-marks scatter plot
- Student cluster scatter plot
- Student-level cluster assignments
- Cluster profile CSV
- Student recommendations CSV

### 8. Learning Behaviour Profiles
The program describes clusters using their average marks and habits. A cluster may be characterized as higher-performing, developing/moderate-performing, or needing additional academic support. These labels are assigned after examining the cluster averages; the numeric cluster ID itself has no inherent meaning.

### 9. Academic Recommendations
Examples of rule-based recommendations include improving attendance, establishing a regular study routine, practising assignments, revising foundational concepts, using active recall and spaced revision, and maintaining effective habits. These suggestions are starting points, not automatic decisions about a student's ability.

### 10. Limitations
- The included data is synthetic and cannot support claims about real students.
- K-Means results depend on the selected features and number of clusters.
- Correlation does not establish causation.
- The simple recommendation rules do not replace professional educational judgment.
- A real deployment should use authorized, representative data and protect student privacy.

### 11. Conclusion
This project demonstrates a complete beginner-level workflow for student data analysis: data loading, EDA, correlation visualization, feature scaling, K-Means clustering, cluster interpretation, and recommendation generation. It can be extended with a larger approved dataset, evaluation of different cluster counts, and a dashboard interface.

### 12. How to Run
Install packages with `py -m pip install -r requirements.txt`, then run `py main.py` from the project folder. The program creates an `outputs` directory automatically.
