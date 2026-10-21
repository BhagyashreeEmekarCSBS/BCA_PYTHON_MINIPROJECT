
import os
import sys

import numpy as np
import pandas as pd
import matplotlib
from pandas import DatetimeIndex
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

matplotlib.use("Agg")  # saves figures to files without GUI display
import matplotlib.pyplot as plt

OUT_DIR = "output"
POLLUTANTS = ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]

# Simplified PM2.5 categories (CPCB India style, ug/m3 24-hr)
AQI_BINS = [0, 30, 60, 90, 120, 250, np.inf]
AQI_LABELS = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
AQI_COLORS = ["#00b050", "#92d050", "#ffff00", "#ffc000", "#ff0000", "#c00000"]


# ----------------------------------------------------------------------------
# 1. DATA LOADING & MULTI-LOCATION GENERATION
# ----------------------------------------------------------------------------
def generate_synthetic_data(days=365, seed=42):
    """Generates multi-location hourly data with realistic patterns, rush-hour peaks,
    winter smog, and city-specific severity levels for clustering."""
    rng = np.random.default_rng(seed)
    cities = ["Downtown Hub", "Industrial Zone", "Residential North", "Green Park", "Highway Junction"]

    dfs = []
    for city in cities:
        idx: DatetimeIndex = pd.date_range("2023-01-01", periods=days * 24, freq="h")
        hour, month, dow = idx.hour, idx.month, idx.dayofweek

        # City-specific pollution multiplier to create distinct clusters
        factor = {"Downtown Hub": 1.2, "Industrial Zone": 1.5, "Residential North": 0.9, "Green Park": 0.5, "Highway Junction": 1.3}[city]

        seasonal = (1 + 0.9 * np.cos((month - 1) / 12 * 2 * np.pi)) * factor
        seasonal = np.where(np.isin(month, [7, 8, 9]), seasonal * 0.5, seasonal)

        daily = (1 + 0.5 * np.exp(-((hour - 9) ** 2) / 6) + 0.6 * np.exp(-((hour - 21) ** 2) / 8))
        weekend = np.where(dow >= 5, 0.85, 1.0)
        base = seasonal * daily * weekend

        pm25 = np.clip(35 * base + rng.normal(0, 10, len(idx)), 2, None)
        city_df = pd.DataFrame({
            "datetime": idx,
            "city": city,
            "PM2.5": pm25,
            "PM10": np.clip(pm25 * 1.6 + rng.normal(0, 15, len(idx)), 5, None),
            "NO2": np.clip(25 * daily * weekend * factor + rng.normal(0, 5, len(idx)), 2, None),
            "SO2": np.clip(10 * seasonal + rng.normal(0, 2, len(idx)), 1, None),
            "CO": np.clip(0.7 * daily * factor + rng.normal(0, 0.1, len(idx)), 0.1, None),
            "O3": np.clip(35 * rng.normal(1, 0.2, len(idx)), 2, None),
        })

        # Sprinkle missing values to mimic sensor gaps
        for col in POLLUTANTS:
            city_df.loc[rng.random(len(city_df)) < 0.02, col] = np.nan
        dfs.append(city_df)

    return pd.concat(dfs, ignore_index=True)


def load_data(path=None):
    if path is None:
        print("No CSV given -> using multi-city synthetic demo data for clustering.")
        return generate_synthetic_data()

    df = pd.read_csv(path)
    date_col = next((c for c in df.columns if c.lower() in ("date", "datetime", "timestamp", "time")), None)
    if date_col is None:
        raise ValueError("No date/datetime/timestamp column found in the CSV.")
    df = df.rename(columns={date_col: "datetime"})
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")

    if "city" not in [c.lower() for c in df.columns] and "location" not in [c.lower() for c in df.columns]:
        df["city"] = "Default_Location"
    else:
        loc_col = next(c for c in df.columns if c.lower() in ("city", "location"))
        df = df.rename(columns={loc_col: "city"})

    # Normalise pollutant names
    rename = {}
    for c in df.columns:
        key = c.lower().replace(".", "").replace("_", "").replace(" ", "")
        for p in POLLUTANTS:
            if key == p.lower().replace(".", ""):
                rename[c] = p
    df = df.rename(columns=rename)
    return df


# ----------------------------------------------------------------------------
# 2. CLEANING & PREPROCESSING
# ----------------------------------------------------------------------------
def clean_data(df):
    df = df.dropna(subset=["datetime"]).sort_values("datetime")
    pols = [p for p in POLLUTANTS if p in df.columns]
    if not pols:
        raise ValueError(f"None of {POLLUTANTS} found in the data.")

    cleaned_dfs = []
    for city, group in df.groupby("city"):
        group = group.set_index("datetime")
        for p in pols:
            group[p] = pd.to_numeric(group[p], errors="coerce")
            group.loc[group[p] < 0, p] = np.nan
            cap = group[p].quantile(0.999)
            group.loc[group[p] > cap * 1.5, p] = np.nan
            group[p] = group[p].interpolate(limit=6, limit_area="inside")

        group["hour"] = group.index.hour
        group["dayofweek"] = group.index.dayofweek
        group["month"] = group.index.month
        group["season"] = group["month"].map(
            {12: "Winter", 1: "Winter", 2: "Winter", 3: "Summer", 4: "Summer", 5: "Summer",
             6: "Monsoon", 7: "Monsoon", 8: "Monsoon", 9: "Monsoon",
             10: "Post-monsoon", 11: "Post-monsoon"})
        cleaned_dfs.append(group.reset_index())

    return pd.concat(cleaned_dfs, ignore_index=True), pols


# ----------------------------------------------------------------------------
# 3. ANALYSIS & MACHINE LEARNING CLUSTERING
# ----------------------------------------------------------------------------
def categorize(series):
    return pd.cut(series, bins=AQI_BINS, labels=AQI_LABELS, right=True)


def run_analysis(df, pols):
    results = {}
    # Overall multi-city summary & location clustering via K-Means
    city_means = df.groupby("city")[pols].mean().dropna()
    if len(city_means) >= 2:
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(city_means)
        k = min(3, len(city_means))
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        city_means["Cluster"] = kmeans.fit_predict(scaled_features)

        # Categorize clusters into high/low pollution groups based on PM2.5 severity
        cluster_order = city_means.groupby("Cluster")["PM2.5"].mean().sort_values().index
        labels_map = {cluster_order[0]: "Low Pollution Group", cluster_order[-1]: "High Pollution Group"}
        if k == 3:
            labels_map[cluster_order[1]] = "Moderate Pollution Group"
        city_means["Pollution Category"] = city_means["Cluster"].map(labels_map)
        results["city_clusters"] = city_means

    # Pick first city or aggregate for temporal analysis
    sample_city = df["city"].iloc[0]
    city_df = df[df["city"] == sample_city].set_index("datetime")

    results["sample_city"] = sample_city
    results["hourly"] = city_df.groupby("hour")[pols].mean()
    results["weekday"] = city_df.groupby("dayofweek")[pols].mean()
    results["monthly"] = city_df.groupby("month")[pols].mean()
    results["seasonal"] = city_df.groupby("season")[pols].mean()
    results["corr"] = city_df[pols].corr()

    if "PM2.5" in pols:
        daily_pm = city_df["PM2.5"].resample("D").mean().dropna()
        results["daily_pm25"] = daily_pm
        results["aqi_share"] = (categorize(daily_pm).value_counts(normalize=True)
                                .reindex(AQI_LABELS).fillna(0) * 100)
        results["worst_days"] = daily_pm.nlargest(5)
        results["rolling30"] = daily_pm.rolling(30, min_periods=15).mean()

    return results


# ----------------------------------------------------------------------------
# 4. VISUALISATION
# ----------------------------------------------------------------------------
def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    print(f"  saved {path}")


def make_plots(df, pols, r):
    plt.style.use("seaborn-v0_8-whitegrid")
    focus = "PM2.5" if "PM2.5" in pols else pols[0]
    scity = r["sample_city"]

    # 1. Hourly pattern
    fig, ax = plt.subplots(figsize=(9, 4.5))
    for p in pols:
        s = r["hourly"][p]
        ax.plot(s.index, s / s.mean(), marker="o", ms=3, label=p)
    ax.set(title=f"Daily pattern in {scity} (hourly average, normalised)",
           xlabel="Hour of day", ylabel="Relative level", xticks=range(0, 24, 2))
    ax.legend(ncol=3, fontsize=8)
    save(fig, "1_hourly_pattern.png")

    # 2. Weekday pattern
    fig, ax = plt.subplots(figsize=(7, 4.5))
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    ax.bar(days, r["weekday"][focus].values, color="#4c72b0")
    ax.set(title=f"{focus} by day of week ({scity})", ylabel="ug/m3")
    save(fig, "2_weekday_pattern.png")

    # 3. Monthly / seasonal pattern
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    axes[0].plot(r["monthly"].index, r["monthly"][focus], marker="o", color="#c44e52")
    axes[0].set(title=f"{focus} monthly average", xlabel="Month", ylabel="ug/m3", xticks=range(1, 13))
    order = [s for s in ["Winter", "Summer", "Monsoon", "Post-monsoon"] if s in r["seasonal"].index]
    axes[1].bar(order, r["seasonal"].loc[order, focus], color="#55a868")
    axes[1].set(title=f"{focus} by season", ylabel="ug/m3")
    save(fig, "3_monthly_seasonal.png")

    # 4. Correlation matrix
    fig, ax = plt.subplots(figsize=(6.5, 5.5))
    c = r["corr"]
    im = ax.imshow(c.values, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(c))); ax.set_xticklabels(c.columns)
    ax.set_yticks(range(len(c))); ax.set_yticklabels(c.columns)
    for i in range(len(c)):
        for j in range(len(c)):
            ax.text(j, i, f"{c.values[i, j]:.2f}", ha="center", va="center", fontsize=8)
    ax.set_title("Pollutant correlation matrix")
    ax.grid(False)
    fig.colorbar(im)
    save(fig, "4_correlation.png")

    # 5. Location Clustering Plot (Scikit-learn K-Means)
    if "city_clusters" in r:
        fig, ax = plt.subplots(figsize=(7, 5))
        cc = r["city_clusters"]
        scatter = ax.scatter(cc["PM2.5"], cc["PM10"], c=cc["Cluster"], cmap="viridis", s=180, edgecolor="k")
        for idx, row in cc.iterrows():
            ax.annotate(f" {idx} ({row['Pollution Category']})", (row["PM2.5"] + 1, row["PM10"]), fontsize=8)
        ax.set(title="Location Clustering by Pollution Level (K-Means)", xlabel="Mean PM2.5", ylabel="Mean PM10")
        save(fig, "5_location_clusters.png")

    # 6. Daily PM2.5 trend + AQI category share
    if "daily_pm25" in r:
        fig, axes = plt.subplots(2, 1, figsize=(11, 8))
        axes[0].plot(r["daily_pm25"], color="lightgray", label="Daily mean")
        axes[0].plot(r["rolling30"], color="#c44e52", label="30-day rolling mean")
        axes[0].set(title=f"Daily PM2.5 trend ({scity})", ylabel="ug/m3")
        axes[0].legend()
        axes[1].bar(r["aqi_share"].index, r["aqi_share"].values, color=AQI_COLORS, edgecolor="black")
        axes[1].set(title="Share of days per air quality category", ylabel="% of days")
        save(fig, "6_trend_and_categories.png")


# ----------------------------------------------------------------------------
# 5. REPORTING & EXPORT
# ----------------------------------------------------------------------------
def print_insights(df, pols, r):
    focus = "PM2.5" if "PM2.5" in pols else pols[0]
    print("\n" + "=" * 65)
    print("MINI PROJECT 8: AIR QUALITY PATTERN ANALYSIS - KEY INSIGHTS")
    print("=" * 65)

    if "city_clusters" in r:
        print("\n--- LOCATION CLUSTERING & POLLUTION GROUPS ---")
        for city, row in r["city_clusters"].iterrows():
            print(f"  * {city:<20} -> {row['Pollution Category']} (Mean PM2.5: {row['PM2.5']:.1f} ug/m3)")

    print(f"\n--- TEMPORAL ANALYSIS ({r['sample_city']}) ---")
    h = r["hourly"][focus]
    m = r["monthly"][focus]
    s = r["seasonal"][focus]
    print(f"Overall Mean ({focus}): {df[df['city'] == r['sample_city']][focus].mean():.1f} ug/m3")
    print(f"Peak Hour      : {h.idxmax()}:00  ({h.max():.1f})   Cleanest Hour: {h.idxmin()}:00  ({h.min():.1f})")
    print(f"Worst Season   : {s.idxmax()}  ({s.max():.1f})   Best Season: {s.idxmin()}  ({s.min():.1f})")

    corr = r["corr"][focus].drop(focus).sort_values(ascending=False)
    if len(corr):
        print(f"Most correlated: {corr.index[0]} (r={corr.iloc[0]:.2f})")


def export_summary(r):
    with pd.ExcelWriter(os.path.join(OUT_DIR, "summary.xlsx")) as w:
        for key in ("hourly", "weekday", "monthly", "seasonal", "corr", "city_clusters"):
            if key in r and isinstance(r[key], pd.DataFrame):
                r[key].round(2).to_excel(w, sheet_name=key[:31])
    print(f"  saved {os.path.join(OUT_DIR, 'summary.xlsx')}")


# ----------------------------------------------------------------------------
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    path = sys.argv[1] if len(sys.argv) > 1 else None
    df = load_data(path)
    df, pols = clean_data(df)
    print(f"Pollutants found: {pols}")
    results = run_analysis(df, pols)
    print_insights(df, pols, results)
    print("\nGenerating outputs...")
    make_plots(df, pols, results)
    export_summary(results)
    print("\nDone! Check the './output' folder for charts and summary Excel report.")


if __name__ == "__main__":
    main()