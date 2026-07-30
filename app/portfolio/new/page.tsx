"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CitySearch } from "@/components/steps/city-search";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import type { CitySearchResult } from "@/lib/sources/nominatim";
import { createScenario } from "@/app/portfolio/new/actions";

const INTERVENTION_TYPES = ["DEVELOP", "FUND", "HOST", "ACQUIRE", "INCENTIVISE", "REGULATE"];
const PRODUCT_CLASSES = [
  { value: "EVENT", label: "Event" },
  { value: "ATTRACTION_BUILT", label: "Attraction — built" },
  { value: "ATTRACTION_NATURAL", label: "Attraction — natural / heritage" },
  { value: "ACCOMMODATION", label: "Accommodation" },
  { value: "MICE", label: "MICE" },
  { value: "CULTURAL_PRODUCT", label: "Cultural product" },
  { value: "DESTINATION_ENABLING_ASSET", label: "Destination-enabling asset" },
];

export default function NewAssessmentPage() {
  const { data: session } = useSession();
  const [city, setCity] = React.useState<CitySearchResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    siteName: "",
    interventionType: "DEVELOP",
    productClass: "EVENT",
    productSubtype: "",
    proponent: "",
    deliveryModel: "",
    strategicObjective: "",
    targetDate: "",
    targetSegments: "",
    preliminaryNotes: "",
    decisionRequired: "",
    decisionDate: "",
    sponsor: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!city) {
      setError("Search and select a destination.");
      return;
    }
    if (!form.name.trim()) {
      setError("Give this opportunity a name.");
      return;
    }
    setSubmitting(true);
    try {
      await createScenario({
        ...form,
        destinationName: city.cityName,
        lat: city.lat,
        lon: city.lon,
        countryCode: city.countryCode,
        interventionType: form.interventionType as never,
        productClass: form.productClass as never,
      });
    } catch (err) {
      // redirect() throws internally on success; only a real failure reaches here
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      setError("Could not create the assessment. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {session?.user && <TimTopBar user={session.user} />}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">New assessment — Stage 1: Opportunity brief</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture what&apos;s known today. Everything here can be revised later — this just starts the traceable
            record.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product & destination</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Product name</Label>
                <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder='e.g. "International Stadium Concert"' />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Destination</Label>
                <CitySearch value={city} onSelect={setCity} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="siteName">Site (optional)</Label>
                <Input id="siteName" value={form.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="e.g. Zayed Sports City" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sponsor">Sponsor</Label>
                <Input id="sponsor" value={form.sponsor} onChange={(e) => set("sponsor", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intervention & delivery</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Intervention type</Label>
                <Select value={form.interventionType} onValueChange={(v) => set("interventionType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVENTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Product class</Label>
                <Select value={form.productClass} onValueChange={(v) => set("productClass", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CLASSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="productSubtype">Subtype</Label>
                <Input id="productSubtype" value={form.productSubtype} onChange={(e) => set("productSubtype", e.target.value)} placeholder="e.g. Stadium concert" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proponent">Proponent</Label>
                <Input id="proponent" value={form.proponent} onChange={(e) => set("proponent", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="deliveryModel">Delivery model</Label>
                <Input id="deliveryModel" value={form.deliveryModel} onChange={(e) => set("deliveryModel", e.target.value)} placeholder="e.g. Government-hosted, promoter-operated" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objective & timing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="strategicObjective">Strategic objective</Label>
                <Textarea id="strategicObjective" rows={2} value={form.strategicObjective} onChange={(e) => set("strategicObjective", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetDate">Target opening / event date</Label>
                <Input id="targetDate" type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetSegments">Target segments / origin markets</Label>
                <Input id="targetSegments" value={form.targetSegments} onChange={(e) => set("targetSegments", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="preliminaryNotes">Preliminary capacity / attendance / CAPEX / subsidy / hosting fee</Label>
                <Textarea id="preliminaryNotes" rows={2} value={form.preliminaryNotes} onChange={(e) => set("preliminaryNotes", e.target.value)} placeholder="Whatever is known today — refine in later stages." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="decisionRequired">Decision required</Label>
                <Input id="decisionRequired" value={form.decisionRequired} onChange={(e) => set("decisionRequired", e.target.value)} placeholder="e.g. Board approval to bid" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="decisionDate">Decision date</Label>
                <Input id="decisionDate" type="date" value={form.decisionDate} onChange={(e) => set("decisionDate", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-nogo">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Create assessment
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
