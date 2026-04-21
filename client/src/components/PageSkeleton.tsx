import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700",
        className
      )}
    />
  );
}

export function MobilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 flex items-center gap-3 flex-shrink-0">
        <Pulse className="w-8 h-8 rounded-full" />
        <Pulse className="h-5 w-36" />
        <div className="ml-auto flex gap-2">
          <Pulse className="w-8 h-8 rounded-full" />
          <Pulse className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <Pulse className="h-36 w-full rounded-2xl" />

        <div className="flex items-center justify-between">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-4 w-16" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 space-y-2">
              <Pulse className="h-24 w-full rounded-lg" />
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-3 w-1/2" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl"
            >
              <Pulse className="w-16 h-16 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Pulse className="h-4 w-3/4" />
                <Pulse className="h-3 w-1/2" />
                <Pulse className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-16 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-around px-4 flex-shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Pulse className="w-6 h-6 rounded-md" />
            <Pulse className="w-10 h-2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 p-4 space-y-2 hidden md:flex md:flex-col flex-shrink-0">
        <Pulse className="h-8 w-3/4 mb-4" />
        <Pulse className="h-4 w-1/2 mb-2" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Pulse key={i} className="h-9 w-full rounded-lg" />
        ))}
        <div className="flex-1" />
        <Pulse className="h-10 w-full rounded-lg" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 flex items-center gap-4 flex-shrink-0">
          <Pulse className="h-6 w-48" />
          <div className="ml-auto flex gap-2">
            <Pulse className="h-9 w-28 rounded-lg" />
            <Pulse className="w-9 h-9 rounded-full" />
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-auto flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <Pulse className="h-4 w-1/2" />
                <Pulse className="h-8 w-2/3" />
                <Pulse className="h-3 w-3/4" />
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <Pulse className="h-5 w-40" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Pulse className="h-4 w-24" />
                  <Pulse className="h-4 flex-1" />
                  <Pulse className="h-4 w-20" />
                  <Pulse className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Pulse key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
        >
          <Pulse className="w-14 h-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Pulse className="h-4 w-2/3" />
            <Pulse className="h-3 w-1/2" />
            <Pulse className="h-3 w-1/3" />
          </div>
          <Pulse className="w-8 h-8 rounded-lg flex-shrink-0 self-center" />
        </div>
      ))}
    </div>
  );
}

export function OrderCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-24" />
            </div>
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-3 w-16" />
          </div>
          <div className="flex justify-between items-center">
            <Pulse className="h-5 w-20" />
            <Pulse className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Pulse className="h-11 w-full rounded-lg mt-2" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-2">
          <Pulse className="h-3 w-3/4" />
          <Pulse className="h-7 w-1/2" />
        </div>
      ))}
    </div>
  );
}
