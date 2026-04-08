import { useEffect, useState } from "react";
import {
  LogOut,
  User,
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
} from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useHomeStore, type Home as HomeModel } from "../stores/homeStore";
import {
  useApplianceStore,
  type Appliance,
} from "../stores/applianceStore";
import { Modal, ConfirmDialog } from "../components/ui";
import { HomeForm } from "../components/homes/HomeForm";
import { ApplianceForm } from "../components/appliances/ApplianceForm";
import { DocumentUploadModal } from "../components/documents/DocumentUploadModal";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  hvac: <Wind className="h-4 w-4 text-blue-500" />,
  plumbing: <Droplets className="h-4 w-4 text-cyan-500" />,
  electrical: <Zap className="h-4 w-4 text-yellow-500" />,
  kitchen: <UtensilsCrossed className="h-4 w-4 text-orange-500" />,
  laundry: <Shirt className="h-4 w-4 text-purple-500" />,
  outdoor: <Leaf className="h-4 w-4 text-green-500" />,
  structural: <Building2 className="h-4 w-4 text-stone-500" />,
  safety: <ShieldCheck className="h-4 w-4 text-red-500" />,
  other: <Wrench className="h-4 w-4 text-gray-400" />,
};

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const {
    homes,
    selectedHome,
    selectHome,
    createHome,
    updateHome,
    deleteHome,
  } = useHomeStore();
  const {
    appliances,
    fetchAppliances,
    createAppliance,
    updateAppliance,
    deleteAppliance,
    clearAppliances,
  } = useApplianceStore();

  // Home modal state
  const [homeModalOpen, setHomeModalOpen] = useState(false);
  const [editingHome, setEditingHome] = useState<HomeModel | null>(null);
  const [confirmDeleteHome, setConfirmDeleteHome] = useState<HomeModel | null>(null);
  const [deletingHome, setDeletingHome] = useState(false);

  // Appliance modal state
  const [applianceModalOpen, setApplianceModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [confirmDeleteAppliance, setConfirmDeleteAppliance] =
    useState<Appliance | null>(null);
  const [deletingAppliance, setDeletingAppliance] = useState(false);

  // Document upload state
  const [docUploadOpen, setDocUploadOpen] = useState(false);

  useEffect(() => {
    if (selectedHome) {
      fetchAppliances(selectedHome.id);
    } else {
      clearAppliances();
    }
  }, [selectedHome?.id, fetchAppliances, clearAppliances]);

  // Home handlers
  const openCreateHome = () => {
    setEditingHome(null);
    setHomeModalOpen(true);
  };
  const openEditHome = (home: HomeModel) => {
    setEditingHome(home);
    setHomeModalOpen(true);
  };
  const closeHomeModal = () => {
    setHomeModalOpen(false);
    setEditingHome(null);
  };
  const handleHomeSubmit = async (values: Partial<HomeModel>) => {
    if (editingHome) {
      await updateHome(editingHome.id, values);
    } else {
      await createHome(values);
    }
    closeHomeModal();
  };
  const handleDeleteHome = async () => {
    if (!confirmDeleteHome) return;
    setDeletingHome(true);
    try {
      await deleteHome(confirmDeleteHome.id);
      setConfirmDeleteHome(null);
    } finally {
      setDeletingHome(false);
    }
  };

  // Appliance handlers
  const openCreateAppliance = () => {
    setEditingAppliance(null);
    setApplianceModalOpen(true);
  };
  const openEditAppliance = (a: Appliance) => {
    setEditingAppliance(a);
    setApplianceModalOpen(true);
  };
  const closeApplianceModal = () => {
    setApplianceModalOpen(false);
    setEditingAppliance(null);
  };
  const handleApplianceSubmit = async (values: Partial<Appliance>) => {
    if (editingAppliance) {
      await updateAppliance(editingAppliance.id, values);
    } else {
      await createAppliance({ ...values, home_id: selectedHome!.id });
    }
    closeApplianceModal();
  };
  const handleDeleteAppliance = async () => {
    if (!confirmDeleteAppliance) return;
    setDeletingAppliance(true);
    try {
      await deleteAppliance(confirmDeleteAppliance.id);
      setConfirmDeleteAppliance(null);
    } finally {
      setDeletingAppliance(false);
    }
  };

  return (
    <div className="p-4 pb-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Account */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Account
        </h2>
        <div className="rounded-xl bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-100 p-2">
              <User className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* My Homes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            My Homes
          </h2>
          <button
            onClick={openCreateHome}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Home
          </button>
        </div>
        <div className="space-y-2">
          {homes.map((home) => (
            <div
              key={home.id}
              className={`rounded-xl border p-4 ${
                selectedHome?.id === home.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Selectable area */}
                <button
                  onClick={() => selectHome(home)}
                  className="flex flex-1 items-center gap-3 min-w-0 text-left"
                >
                  <Home
                    className={`h-5 w-5 shrink-0 ${
                      selectedHome?.id === home.id
                        ? "text-brand-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{home.name}</p>
                    <p className="text-xs text-gray-500">
                      {[home.city, home.state].filter(Boolean).join(", ") ||
                        "No location set"}
                    </p>
                  </div>
                </button>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditHome(home)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit home"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteHome(home)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Delete home"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {homes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No homes added yet. Click "Add Home" to get started.
            </p>
          )}
        </div>
      </section>

      {/* Appliances */}
      {selectedHome && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Appliances — {selectedHome.name}
            </h2>
            <button
              onClick={openCreateAppliance}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {appliances.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {CATEGORY_ICON[a.category] ?? CATEGORY_ICON.other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-gray-500">
                      {[a.brand, a.model_number].filter(Boolean).join(" · ") ||
                        a.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditAppliance(a)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit appliance"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteAppliance(a)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Delete appliance"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {appliances.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No appliances added yet. Click "Add" to track your appliances.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Documents */}
      {selectedHome && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Documents
          </h2>
          <button
            onClick={() => setDocUploadOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
          >
            <FileUp className="h-4 w-4" />
            Upload Manual or Warranty (PDF, TXT, DOC)
          </button>
        </section>
      )}

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      {/* Home modals */}
      <Modal
        isOpen={homeModalOpen}
        onClose={closeHomeModal}
        title={editingHome ? "Edit Home" : "Add Home"}
      >
        <HomeForm
          initialValues={editingHome ?? undefined}
          onSubmit={handleHomeSubmit}
          onCancel={closeHomeModal}
          submitLabel={editingHome ? "Save Changes" : "Create Home"}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteHome}
        onClose={() => setConfirmDeleteHome(null)}
        onConfirm={handleDeleteHome}
        title="Delete Home"
        message={`Delete "${confirmDeleteHome?.name}"? This will also remove all associated appliances and tasks.`}
        isLoading={deletingHome}
      />

      {/* Appliance modals */}
      <Modal
        isOpen={applianceModalOpen}
        onClose={closeApplianceModal}
        title={editingAppliance ? "Edit Appliance" : "Add Appliance"}
      >
        {selectedHome && (
          <ApplianceForm
            homeId={selectedHome.id}
            initialValues={editingAppliance ?? undefined}
            onSubmit={handleApplianceSubmit}
            onCancel={closeApplianceModal}
            submitLabel={editingAppliance ? "Save Changes" : "Add Appliance"}
          />
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

      {/* Document upload */}
      {selectedHome && (
        <DocumentUploadModal
          homeId={selectedHome.id}
          isOpen={docUploadOpen}
          onClose={() => setDocUploadOpen(false)}
        />
      )}
    </div>
  );
}
