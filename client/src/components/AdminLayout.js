import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AdminSidebar from "./AdminSidebar";
export default function AdminLayout({ children, title }) {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex", children: [_jsx(AdminSidebar, {}), _jsxs("main", { className: "flex-1 ml-64", children: [_jsx("header", { className: "bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-30", children: _jsx("h1", { className: "text-2xl font-black text-gray-900", children: title }) }), _jsx("div", { className: "p-8", children: children }), _jsx("footer", { className: "p-8 text-center text-xs text-gray-400", children: "Made By Khevin Andrew Kita - Ed Corporation" })] })] }));
}
//# sourceMappingURL=AdminLayout.js.map