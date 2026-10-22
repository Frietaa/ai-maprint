import type { AdminSettingsDto } from '@maba-printing/shared'
import { type FormEvent, useState } from 'react'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { ErrorState } from '../../components/ui/DataState.tsx'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import {
  AdminPageTitle,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  Panel,
} from '../../features/admin/AdminUi.tsx'
import { SaveFeedback, TextInput } from '../../features/admin/CatalogParts.tsx'
import {
  useAdminSettings,
  useSaveSettings,
} from '../../features/admin/use-admin.ts'

export function AdminSettingsPage() {
  const settings = useAdminSettings()
  return (
    <>
      <PageMeta title="Pengaturan" description="Informasi usaha." />
      <AdminPageTitle title="Pengaturan usaha" />
      {settings.isPending ? (
        <p role="status" className="text-slate-600">
          Memuat pengaturan…
        </p>
      ) : settings.isError ? (
        <ErrorState
          error={settings.error}
          onRetry={() => void settings.refetch()}
          retrying={settings.isFetching}
        />
      ) : (
        <SettingsForm settings={settings.data} />
      )}
    </>
  )
}

function SettingsForm({ settings }: { settings: AdminSettingsDto }) {
  const save = useSaveSettings()
  const [businessName, setBusinessName] = useState(settings.businessName ?? '')
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber ?? '')
  const [logoRef, setLogoRef] = useState(settings.logoRef ?? '')
  const [qrisImageRef, setQrisImageRef] = useState(settings.qrisImageRef ?? '')
  const [publicInfo, setPublicInfo] = useState(settings.publicInfo ?? '')
  const [links, setLinks] = useState(
    Object.entries(settings.socialLinks).map(([platform, url]) => ({
      platform,
      url,
    })),
  )
  const [problem, setProblem] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const orNull = (value: string) => (value.trim() === '' ? null : value)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const filled = links.filter(
      (link) => link.platform.trim() || link.url.trim(),
    )
    if (filled.some((link) => !link.platform.trim() || !link.url.trim())) {
      setProblem('Lengkapi nama platform dan URL untuk setiap tautan sosial.')
      return
    }
    // Only changed fields are sent: an untouched legacy value (e.g. a
    // storage-key reference from older data) never blocks other edits.
    const next = {
      businessName: orNull(businessName),
      whatsappNumber: orNull(whatsapp),
      logoRef: orNull(logoRef),
      qrisImageRef: orNull(qrisImageRef),
      publicInfo: orNull(publicInfo),
    }
    const body: Record<string, unknown> = Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) => value !== settings[key as keyof typeof next],
      ),
    )
    const socialLinks = Object.fromEntries(
      filled.map((link) => [
        link.platform.trim().toLowerCase(),
        link.url.trim(),
      ]),
    )
    if (JSON.stringify(socialLinks) !== JSON.stringify(settings.socialLinks)) {
      body.socialLinks = socialLinks
    }
    if (Object.keys(body).length === 0) {
      setProblem('Tidak ada perubahan untuk disimpan.')
      return
    }
    setProblem(null)
    setSaved(false)
    save.mutate(body, { onSuccess: () => setSaved(true) })
  }

  return (
    <Panel title="Informasi yang tampil di situs">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Nama usaha"
            value={businessName}
            onChange={setBusinessName}
          />
          <TextInput
            label="Nomor WhatsApp"
            value={whatsapp}
            onChange={setWhatsapp}
            inputMode="tel"
            hint="Dipakai untuk tautan WhatsApp di situs dan tanda terima pesanan."
          />
          <TextInput
            label="Logo"
            value={logoRef}
            onChange={setLogoRef}
            inputMode="url"
            hint="URL https atau path yang diawali /"
          />
          <TextInput
            label="Gambar QRIS"
            value={qrisImageRef}
            onChange={setQrisImageRef}
            inputMode="url"
            hint="URL https atau path yang diawali / (belum ditampilkan ke pelanggan)."
          />
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Informasi publik{' '}
          <span className="font-normal text-slate-500">(opsional)</span>
          <textarea
            className={`${inputClass} py-2`}
            rows={3}
            value={publicInfo}
            onChange={(e) => setPublicInfo(e.target.value)}
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">
            Media sosial
          </legend>
          {links.map((link, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2">
              <label className="text-sm text-slate-700">
                Platform
                <input
                  className={`${inputClass} w-36`}
                  value={link.platform}
                  onChange={(e) =>
                    setLinks(
                      links.map((l, i) =>
                        i === index ? { ...l, platform: e.target.value } : l,
                      ),
                    )
                  }
                />
              </label>
              <label className="min-w-48 flex-1 text-sm text-slate-700">
                URL
                <input
                  className={inputClass}
                  inputMode="url"
                  value={link.url}
                  onChange={(e) =>
                    setLinks(
                      links.map((l, i) =>
                        i === index ? { ...l, url: e.target.value } : l,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setLinks(links.filter((_l, i) => i !== index))}
              >
                Hapus
              </button>
            </div>
          ))}
          {links.length < 10 ? (
            <button
              type="button"
              className={buttonSecondary}
              onClick={() => setLinks([...links, { platform: '', url: '' }])}
            >
              + Tautan
            </button>
          ) : null}
        </fieldset>
        {problem ? <FormAlert tone="error">{problem}</FormAlert> : null}
        <SaveFeedback
          error={save.error}
          saved={
            saved ? 'Pengaturan disimpan dan langsung tampil di situs.' : null
          }
        />
        <button
          type="submit"
          className={buttonPrimary}
          disabled={save.isPending}
        >
          {save.isPending ? 'Menyimpan…' : 'Simpan pengaturan'}
        </button>
      </form>
    </Panel>
  )
}
