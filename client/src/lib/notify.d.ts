export declare function requestNotifPermission(): Promise<boolean>;
export declare function getNotifPermission(): Promise<"granted" | "denied" | "default">;
export declare function showNotif(title: string, body: string, icon?: string): Promise<void>;
export declare function handleWSEvent(data: any): void;
//# sourceMappingURL=notify.d.ts.map