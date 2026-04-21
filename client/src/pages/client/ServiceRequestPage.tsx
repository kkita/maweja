import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { apiRequest, queryClient, authFetchJson, resolveImg } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import type { ServiceRequest, ServiceCategory } from "@shared/schema";
import SuccessScreen from "../../components/service-request/SuccessScreen";
import ViewRequestScreen from "../../components/service-request/ViewRequestScreen";
import CatalogModelForm from "../../components/service-request/CatalogModelForm";
import StandardForm from "../../components/service-request/StandardForm";

function parseMinPrice(priceStr: string): number | null {
  const match = priceStr.match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export default function ServiceRequestPage() {
  const [currentPath, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const pathParts = currentPath.split("/");
  const requestId = pathParts[pathParts.length - 1];
  const isViewMode = pathParts.includes("request") && requestId && !isNaN(Number(requestId));

  const stored = sessionStorage.getItem("maweja_service_request");
  const catalogData = stored ? JSON.parse(stored) : null;

  const categoryId = catalogData?.categoryId || null;
  const categoryName = catalogData?.categoryName || "";
  const categoryImageUrl = catalogData?.categoryImageUrl || null;
  const catalogItemId = catalogData?.catalogItemId || null;
  const catalogItemName = catalogData?.catalogItemName || null;
  const catalogItemPrice = catalogData?.catalogItemPrice || null;
  const catalogItemImage = catalogData?.catalogItemImage || null;

  const hasCatalogModel = !!catalogItemName;
  const minPrice = catalogItemPrice ? parseMinPrice(catalogItemPrice) : null;

  const { data: existingRequest } = useQuery<ServiceRequest>({
    queryKey: ["/api/service-requests", requestId],
    queryFn: () => authFetchJson(`/api/service-requests/${requestId}`),
    enabled: !!isViewMode && !!user,
    refetchInterval: 20000,
  });

  const [scheduledType, setScheduledType] = useState("asap");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [budget, setBudget] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [contactMethod, setContactMethod] = useState("phone");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    if (user && !fullName) {
      setFullName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const { data: allCategories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const currentCategory = allCategories.find(c => c.id === Number(categoryId));
  const dynamicTypes = currentCategory?.serviceTypes?.length ? [...currentCategory.serviceTypes, "Autre"] : null;
  const customFields: { id: string; label: string; type: string; required: boolean; placeholder?: string; options?: string[] }[] =
    (currentCategory as any)?.customFields || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-requests", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setSubmitted(true);
    },
    onError: (err: any) => {
      let msg = err?.message || t.common.error;
      try { msg = JSON.parse(msg)?.message || msg; } catch {}
      if (msg.includes("401") || msg.includes("Non authentifie")) {
        toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer une demande.", variant: "destructive" });
        navigate("/login");
      } else if (msg.includes("403") || msg.includes("interdit")) {
        toast({ title: "Accès refusé", description: "Seuls les clients peuvent envoyer des demandes de service.", variant: "destructive" });
      } else {
        toast({ title: "Erreur d'envoi", description: msg, variant: "destructive" });
      }
    },
  });

  const validatePrice = (value: string): boolean => {
    if (!minPrice || !value.trim()) return true;
    const numMatch = value.match(/(\d+)/);
    if (!numMatch) return true;
    const enteredPrice = parseInt(numMatch[1], 10);
    if (enteredPrice < minPrice) {
      setPriceError(`${t.services.priceTooLow} (${t.services.minPrice}: $${minPrice})`);
      return false;
    }
    setPriceError("");
    return true;
  };

  const handleBudgetChange = (value: string) => {
    setBudget(value);
    if (priceError) validatePrice(value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer une demande de service.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (user.role !== "client") {
      toast({ title: "Accès refusé", description: "Seuls les clients peuvent envoyer des demandes de service.", variant: "destructive" });
      return;
    }
    if (!categoryId && !categoryName) {
      toast({ title: "Catégorie manquante", description: "Veuillez sélectionner une catégorie de service.", variant: "destructive" });
      navigate("/services");
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Numéro requis", description: "Veuillez entrer votre numéro de téléphone.", variant: "destructive" });
      return;
    }
    if (hasCatalogModel && budget.trim() && !validatePrice(budget)) return;
    if (!hasCatalogModel && (!fullName.trim() || !phone.trim())) {
      toast({ title: "Champs requis", description: "Veuillez remplir votre nom et téléphone.", variant: "destructive" });
      return;
    }
    const missingRequired = customFields.filter(f => f.required && !customFieldValues[f.id]?.trim());
    if (missingRequired.length > 0) {
      toast({ title: "Champs requis", description: `Veuillez remplir: ${missingRequired.map(f => f.label).join(", ")}`, variant: "destructive" });
      return;
    }

    let finalAdditionalInfo = hasCatalogModel
      ? `[${t.services.selectedModel}: ${catalogItemName}${catalogItemPrice ? ` (${catalogItemPrice})` : ""}]${catalogItemImage ? `\n[Image: ${catalogItemImage}]` : ""}${additionalInfo ? `\n${additionalInfo}` : ""}`
      : additionalInfo;

    const filledCustomFields = customFields
      .filter(f => customFieldValues[f.id]?.trim())
      .map(f => ({ label: f.label, value: customFieldValues[f.id] }));
    if (filledCustomFields.length > 0) {
      finalAdditionalInfo = (finalAdditionalInfo ? finalAdditionalInfo + "\n" : "") +
        "[CustomFields:" + JSON.stringify(filledCustomFields) + "]";
    }

    createMutation.mutate({
      categoryId: Number(categoryId) || 1,
      categoryName: categoryName || "Service",
      scheduledType,
      scheduledDate: scheduledType === "scheduled" ? scheduledDate : null,
      scheduledTime: scheduledType === "scheduled" ? scheduledTime : null,
      fullName: fullName || user?.name || "Client",
      phone,
      address: address || user?.address || "Non précisé",
      serviceType: catalogItemName ? `${catalogItemName}${serviceType ? ` - ${serviceType}` : ""}` : serviceType || "Non précisé",
      budget: budget || catalogItemPrice || "",
      additionalInfo: finalAdditionalInfo,
      contactMethod,
    });
  };

  if (submitted) {
    return (
      <SuccessScreen
        navigate={navigate} t={t}
        hasCatalogModel={hasCatalogModel} catalogItemImage={catalogItemImage}
        catalogItemName={catalogItemName} categoryName={categoryName}
        budget={budget} catalogItemPrice={catalogItemPrice} contactMethod={contactMethod}
      />
    );
  }

  if (isViewMode && existingRequest) {
    return <ViewRequestScreen navigate={navigate} t={t} existingRequest={existingRequest} />;
  }

  const commonFormProps = {
    navigate, t, categoryName, categoryImageUrl, scheduledType, setScheduledType,
    scheduledDate, setScheduledDate, scheduledTime, setScheduledTime,
    phone, setPhone, address, setAddress,
    budget, additionalInfo, setAdditionalInfo,
    contactMethod, setContactMethod,
    handleSubmit, isPending: createMutation.isPending, capitalizeWords,
  };

  if (hasCatalogModel) {
    return (
      <CatalogModelForm
        {...commonFormProps}
        catalogItemImage={catalogItemImage} catalogItemName={catalogItemName}
        catalogItemPrice={catalogItemPrice} minPrice={minPrice}
        currentCategory={currentCategory}
        handleBudgetChange={handleBudgetChange} validatePrice={validatePrice} priceError={priceError}
      />
    );
  }

  return (
    <StandardForm
      {...commonFormProps}
      typeOptions={dynamicTypes || ["A preciser"]}
      customFields={customFields} currentCategory={currentCategory}
      fullName={fullName} setFullName={setFullName}
      serviceType={serviceType} setServiceType={setServiceType}
      setBudget={setBudget}
      customFieldValues={customFieldValues} setCustomFieldValues={setCustomFieldValues}
    />
  );
}
