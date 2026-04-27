import type { Customer } from "./types";

interface Props {
  customer: Pick<Customer, "name" | "avatar">;
  size?: number;
}

export default function Avatar({ customer, size = 40 }: Props) {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-red-500 to-red-700 shadow-md"
      style={{ width: size, height: size }}
    >
      {customer.avatar ? (
        <img src={customer.avatar} alt={customer.name} className="w-full h-full rounded-xl object-cover" />
      ) : (
        <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
          {customer.name?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}
