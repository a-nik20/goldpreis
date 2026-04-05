import type React from "react";

export const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f5f7fb",
  padding: "30px 15px 40px",
  fontFamily: "Arial, sans-serif",
};

export const containerStyle: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
};

export const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "bold",
  marginBottom: "12px",
  textAlign: "center",
  color: "#1f2937",
};

export const introStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#4b5563",
  marginBottom: "20px",
  fontSize: "16px",
  lineHeight: 1.6,
};

export const trustBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
  color: "#065f46",
  fontSize: "13px",
  fontWeight: 700,
};

export const infoStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  marginBottom: "20px",
  fontSize: "15px",
};

export const topInfoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginBottom: "22px",
};

export const topInfoCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "16px 18px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  color: "#1f2937",
};

export const topInfoTextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#4b5563",
  lineHeight: 1.6,
  fontSize: "14px",
};

export const toolbarStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

export const toolbarGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "flex-end",
  position: "relative",
};

export const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
  minWidth: "180px",
};

export const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "11px 12px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#fff",
};

export const selectStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "11px 12px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#fff",
};

export const suggestionBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: "86px",
  left: 0,
  width: "320px",
  maxWidth: "92vw",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
  zIndex: 20,
  overflow: "hidden",
};

export const suggestionItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "none",
  backgroundColor: "#fff",
  padding: "12px 14px",
  cursor: "pointer",
  fontSize: "14px",
};

export const utilityButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 14px",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
};

export const utilityButtonActiveStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

export const statusRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "18px",
};

export const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  borderRadius: "999px",
  backgroundColor: "#e0f2fe",
  color: "#075985",
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: "13px",
};

export const statusSubtleStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
};

export const loadingBoxStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
  backgroundColor: "#eef6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  fontWeight: 600,
};

export const errorBoxStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  fontWeight: 600,
};

export const noticeBoxStyle: React.CSSProperties = {
  backgroundColor: "#fff8e7",
  border: "1px solid #f4d58d",
  borderRadius: "14px",
  padding: "16px 18px",
  marginBottom: "24px",
  color: "#5b4a1f",
  lineHeight: 1.6,
  fontSize: "14px",
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "24px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  overflowX: "auto",
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: "24px",
  marginBottom: "16px",
  color: "#111827",
};

export const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

export const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "2px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  color: "#374151",
  fontSize: "15px",
};

export const favoriteThStyle: React.CSSProperties = {
  ...thStyle,
  width: "58px",
  textAlign: "center",
};

export const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#1f2937",
  fontSize: "15px",
  verticalAlign: "top",
};

export const favoriteTdStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "center",
};

export const favoriteButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "22px",
  lineHeight: 1,
  color: "#9ca3af",
};

export const favoriteButtonActiveStyle: React.CSSProperties = {
  color: "#f59e0b",
};

export const emptyStateStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  color: "#6b7280",
  textAlign: "center",
  fontWeight: 600,
};

export const favoriteGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

export const favoriteCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "14px",
  backgroundColor: "#f9fafb",
};

export const favoriteCardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  alignItems: "flex-start",
  marginBottom: "10px",
};

export const favoriteCardBodyStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  fontSize: "14px",
  color: "#374151",
};

export const tabContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "25px",
  flexWrap: "wrap",
};

export const tabButton: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  fontWeight: 700,
  fontSize: "14px",
};

export const activeTabStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

export const calculatorGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

export const calculatorHintStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  marginBottom: "14px",
};

export const calculatorResultStyle: React.CSSProperties = {
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "16px 18px",
  fontSize: "16px",
  color: "#111827",
  display: "grid",
  gap: "6px",
};

export const alertListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

export const alertCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "14px 16px",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
  backgroundColor: "#f9fafb",
};

export const alertSubTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "4px",
};

export const removeAlertButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "10px",
  padding: "10px 12px",
  backgroundColor: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
};

export const historyToolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

export const rangeButtonWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "flex-end",
};

export const rangeButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 14px",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
};

export const rangeButtonActiveStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

export const historyWrapStyle: React.CSSProperties = {
  borderRadius: "16px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "16px",
};

export const historyHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

export const historyStatsStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  color: "#374151",
  fontSize: "14px",
  alignItems: "center",
};

export const chartOuterStyle: React.CSSProperties = {
  position: "relative",
  overflowX: "auto",
};

export const chartTooltipStyle: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  backgroundColor: "#111827",
  color: "#fff",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

export const historyLabelsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "12px",
  flexWrap: "wrap",
};

export const historyLabelItemStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center",
  minWidth: "52px",
};

export const trustInfoSectionStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginBottom: "24px",
};

export const trustInfoCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "16px 18px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  color: "#1f2937",
};

export const footerSourceStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "8px",
  lineHeight: 1.6,
};

export const updatedStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "10px",
};

export const bottomLegalNavStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  marginTop: "16px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

export const bottomLegalButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#374151",
  cursor: "pointer",
  textDecoration: "underline",
  fontSize: "14px",
  padding: "6px 8px",
};

export const activeBottomLegalButtonStyle: React.CSSProperties = {
  color: "#111827",
  fontWeight: 700,
};

export const legalTextStyle: React.CSSProperties = {
  color: "#1f2937",
  lineHeight: 1.8,
  fontSize: "15px",
};

export const copyButtonStyle: React.CSSProperties = {
  marginTop: "8px",
  border: "none",
  borderRadius: "10px",
  padding: "10px 12px",
  backgroundColor: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
};