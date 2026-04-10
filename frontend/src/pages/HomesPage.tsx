import { useEffect, useState } from "react";
import {
  Home,
  Plus,
  Pencil,
  Trash2,
  Wind,
  Droplets,
  Zap,
  UtensilsCrossed,
  Shirt,
  Leaf,
  Building2,
  ShieldCheck,
  Wrench,
  FileUp,
  Search,
} from "lucide-react";
import { useHomeStore, type Home as HomeModel } from "../stores/homeStore";
import { useApplianceStore, type Appliance } from "../stores/applianceStore";
import { Modal, ConfirmDialog } from "../components/ui";
import { HomeForm } from "../components/homes/HomeForm";
import { ApplianceForm } from "../components/appliances/ApplianceForm";
import { DocumentUploadModal } from "../components/documents/DocumentUploadModal";
import { ManualSearchModal } from "../components/manuals/ManualSearchModal";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  hvac:       <Wind className="h-4 w-4 text-blue-500" />,
  plumbing:   <Droplets className="h-4 w-4 text-cyan-500" />,
  electrical: <Zap className="h-4 w-4 text-yellow-500" />,
  kitchen:    <UtensilsCrossed className="h-4 w-4 text-orange-500" />,
  laundry:    <Shirt className="h-4 w-4 text-purple-500" />,
  outdoor:    <Leaf className="h-4 w-4 text-green-500" />,
  structural: <Building2 className="h-4 w-4 text-stone-500" />,
  safety:     <ShieldCheck className="h-4 w-4 text-red-500" />,
  other:      <Wrench className="h-4 w-4 text-warm-400" />,
};

const SECTION_LABEL = "mb-3 text-xs font-semibold uppercase tracking-widest text-warm-600";

export function HomesPage() {
  const { homes, selectedHome, selectHome, createHome, updateHome, deleteHome } = useHomeStore();
  const { appliances, fetchAppliances, createAppliance, updateAppliance, deleteAppliance, clearAppliances } =
    useApplianceStore();

  const [homeModalOpen, setHomeModalOpen] = useState(false);
  const [editingHome, setEditingHome] = useState<HomeModel | null>(null);
  const [confirmDeleteHome, setConfirmDeleteHome] = useState<HomeModel | null>(null);
  const [deletingHome, setDeletingHome] = useState(false);
  const [homeFormSubmitting, setHomeFormSubmitting] = useState(false);

  const [applianceModalOpen, setApplianceModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [confirmDeleteAppliance, setConfirmDeleteAppliance] = useState<Appliance | null>(null);
  const [deletingAppliance, setDeletingAppliance] = useState(false);
  const [applianceFormSubmitting, setApplianceFormSubmitting] = useState(false);

  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [manualSearchOpen, setManualSearchOpen] = useState(false);
  const [manualSearchAppliance, setManualSearchAppliance] = useState<Appliance | null>(null);

  useEffect(() => {
    if (selectedHome) {
      fetchAppliances(selectedHome.id);
    } else {
      clearAppliances();
    }
  }, [selectedHome?.id, fetchAppliances, clearAppliances]);

  const openCreateHome = () => { setEditingHome(null); setHomeModalOpen(true); };
  const openEditHome = (home: HomeModel) => { setEditingHome(home); setHomeModalOpen(true); };
  const closeHomeModal = () => { setHomeModalOpen(false); setEditingHome(null); };
  const handleHomeSubmit = async (values: Partial<HomeModel>) => {
    if (editingHome) { await updateHome(editingHome.id, values); }
    else { await createHome(values); }
    closeHomeModal();
  };
  const handleDeleteHome = async () => {
    if (!confirmDeleteHome) return;
    setDeletingHome(true);
    try { await deleteHome(confirmDeleteHome.id); setConfirmDeleteHome(null); }
    finally { setDeletingHome(false); }
  };

  const openCreateAppliance = () => { setEditingAppliance(null); setApplianceModalOpen(true); };
  const openEditAppliance = (a: Appliance) => { setEditingAppliance(a); setApplianceModalOpen(true); };
  const closeApplianceModal = () => { setApplianceModalOpen(false); setEditingAppliance(null); };
  const handleApplianceSubmit = async (values: Partial<Appliance>) => {
    if (editingAppliance) { await updateAppliance(editingAppliance.id, values); }
    else { await createAppliance({ ...values, home_id: selectedHome!.id }); }
    closeApplianceModal();
  };
  const handleDeleteAppliance = async () => {
    if (!confirmDeleteAppliance) return;
    setDeletingAppliance(true);
    try { await deleteAppliance(confirmDeleteAppliance.id); setConfirmDeleteAppliance(null); }
    finally { setDeletingAppliance(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 md:max-w-3xl md:px-8 md:pt-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-warm-900 md:text-3xl animate-fade-in">
        Homes
      </h1>

      {/* My Homes */}
      <section className="mb-7 animate-fade-up stagger-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className={SECTION_LABEL}>My Homes</h2>
          <button
            onClick={openCreateHome}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Home
          </button>
        </div>
        <div className="space-y-2">
          {homes.map((home) => (
            <div
              key={home.id}
              className={`rounded-xl border p-4 transition-colors ${
                selectedHome?.id === home.id
                  ? "border-brand-400 bg-brand-50"
                  : "border-warm-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => selectHome(home)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Home
                    className={`h-5 w-5 shrink-0 ${
                      selectedHome?.id === home.id ? "text-brand-600" : "text-warm-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-warm-900">{home.name}</p>
                    <p className="text-xs text-warm-500">
                      {[home.city, home.state].filter(Boolean).join(", ") || "No location set"}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEditHome(home)}
                    className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-700"
                    title="Edit home"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteHome(home)}
                    className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Delete home"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {homes.length === 0 && (
            <p className="py-4 text-center text-sm text-warm-400">
              No homes added yet. Click "Add Home" to get started.
            </p>
          )}
        </div>
      </section>

      {/* Appliances */}
      {selectedHome && (
        <section className="mb-7 animate-fade-up stagger-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className={SECTION_LABEL}>
              Appliances — {selectedHome.name}
            </h2>
            <button
              onClick={openCreateAppliance}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {appliances.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-warm-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {CATEGORY_ICON[a.category] ?? CATEGORY_ICON.other}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-warm-900">{a.name}</p>
                    <p className="text-xs text-warm-500">
                      {[a.brand, a.model_number].filter(Boolean).join(" · ") || a.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => { setManualSearchAppliance(a); setManualSearchOpen(true); }}
                      className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                      title="Find user manual"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditAppliance(a)}
                      className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-700"
                      title="Edit appliance"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteAppliance(a)}
                      className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Delete appliance"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {appliances.length === 0 && (
              <p className="py-4 text-center text-sm text-warm-400">
                No appliances added yet. Click "Add" to track your appliances.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Documents */}
      {selectedHome && (
        <section className="mb-7 animate-fade-up stagger-3">
          <h2 className={SECTION_LABEL}>Documents</h2>
          <button
            onClick={() => setDocUploadOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-warm-300 bg-white p-4 text-sm text-warm-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
          >
            <FileUp className="h-4 w-4" />
            Upload Manual or Warranty (PDF, TXT, DOC)
          </button>
        </section>
      )}

      {/* Modals */}
      <Modal
        isOpen={homeModalOpen}
        onClose={closeHomeModal}
        title={editingHome ? "Edit Home" : "Add Home"}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeHomeModal} disabled={homeFormSubmitting}
              className="flex-1 rounded-lg border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="home-form" disabled={homeFormSubmitting}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {homeFormSubmitting ? "Saving…" : editingHome ? "Save Changes" : "Create Home"}
            </button>
          </div>
        }
      >
        <HomeForm formId="home-form" initialValues={editingHome ?? undefined} onSubmit={handleHomeSubmit} onCancel={closeHomeModal} onSubmittingChange={setHomeFormSubmitting} />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteHome}
        onClose={() => setConfirmDeleteHome(null)}
        onConfirm={handleDeleteHome}
        title="Delete Home"
        message={`Delete "${confirmDeleteHome?.name}"? This will also remove all associated appliances and tasks.`}
        isLoading={deletingHome}
      />

      <Modal
        isOpen={applianceModalOpen}
        onClose={closeApplianceModal}
        title={editingAppliance ? "Edit Appliance" : "Add Appliance"}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeApplianceModal} disabled={applianceFormSubmitting}
              className="flex-1 rounded-lg border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="appliance-form" disabled={applianceFormSubmitting}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {applianceFormSubmitting ? "Saving…" : editingAppliance ? "Save Changes" : "Add Appliance"}
            </button>
          </div>
        }
      >
        {selectedHome && (
          <ApplianceForm formId="appliance-form" homeId={selectedHome.id} initialValues={editingAppliance ?? undefined} onSubmit={handleApplianceSubmit} onCancel={closeApplianceModal} onSubmittingChange={setApplianceFormSubmitting} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteAppliance}
        onClose={() => setConfirmDeleteAppliance(null)}
        onConfirm={handleDeleteAppliance}
        title="Delete Appliance"
        message={`Delete "${confirmDeleteAppliance?.name}"?`}
        isLoading={deletingAppliance}
      />

      {selectedHome && (
        <DocumentUploadModal homeId={selectedHome.id} isOpen={docUploadOpen} onClose={() => setDocUploadOpen(false)} />
      )}

      <ManualSearchModal
        appliance={manualSearchAppliance}
        isOpen={manualSearchOpen}
        onClose={() => setManualSearchOpen(false)}
        onUploadInstead={() => {
          setManualSearchOpen(false);
          setDocUploadOpen(true);
        }}
      />
    </div>
  );
}
