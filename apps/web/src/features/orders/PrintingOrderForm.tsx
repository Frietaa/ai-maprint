import { type ChangeEvent, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { TextAreaField } from '../../components/ui/FormControls.tsx'
import { CustomerFields } from './CustomerFields.tsx'
import {
  type CustomerFormValues,
  emptyCustomerValues,
} from './customer-form.ts'
import { OrderFormFrame } from './OrderFormFrame.tsx'
import { optionalText, toCustomerInput } from './order-request.ts'
import {
  ACCEPTED_FILE_INPUT,
  FILE_RULES_HINT,
  formatFileSize,
  validateFiles,
  validateLongText,
} from './order-validation.ts'
import { useSubmitOrder } from './use-orders.ts'

interface PrintingValues extends CustomerFormValues {
  description: string
}

// Printing request (PRD §8): documents plus free-text instructions. Paper
// size, colour, copies, binding and the like are deliberately not separate
// fields — they are described here or settled via WhatsApp.
export function PrintingOrderForm() {
  const form = useForm<PrintingValues>({
    defaultValues: { ...emptyCustomerValues, description: '' },
  })
  const submit = useSubmitOrder()
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  function onFilesChosen(event: ChangeEvent<HTMLInputElement>) {
    const chosen = [...files, ...Array.from(event.target.files ?? [])]
    event.target.value = ''
    setFiles(chosen)
    setFileError(validateFiles(chosen))
  }

  function removeFile(index: number) {
    const next = files.filter((_file, i) => i !== index)
    setFiles(next)
    setFileError(validateFiles(next))
  }

  const onSubmit = form.handleSubmit((values) => {
    if (submit.isPending) return
    const problem = validateFiles(files)
    setFileError(problem)
    if (problem) return
    if (values.description.trim() === '' && files.length === 0) {
      setFormError('Unggah file atau tuliskan kebutuhan cetak Anda.')
      return
    }
    setFormError(null)
    submit.mutate({
      order: {
        type: 'PRINTING',
        ...toCustomerInput(values),
        description: optionalText(values.description),
      },
      files,
    })
  })

  return (
    <FormProvider {...form}>
      <OrderFormFrame
        id="pesan-printing"
        title="Ajukan permintaan printing"
        intro="Unggah dokumen dan tuliskan kebutuhan cetak Anda. Detail seperti ukuran kertas, warna, jumlah salinan, dan jilid dapat dikonfirmasi bersama kami."
        onSubmit={(event) => void onSubmit(event)}
        pending={submit.isPending}
        error={submit.error}
        formError={formError}
        receipt={submit.data}
        onNewRequest={() => {
          submit.reset()
          form.reset()
          setFiles([])
        }}
      >
        <CustomerFields
          completionRequired
          completionLabel="Tenggat yang diinginkan (WIB)"
        />
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-slate-900">
            Dokumen &amp; kebutuhan cetak
          </legend>
          <div>
            <label
              htmlFor="printing-files"
              className="block text-sm font-medium text-slate-800"
            >
              File dokumen{' '}
              <span className="font-normal text-slate-500">(opsional)</span>
            </label>
            <p id="printing-files-hint" className="mt-1 text-sm text-slate-600">
              {FILE_RULES_HINT} File lain dapat dikirim lewat WhatsApp.
            </p>
            <input
              id="printing-files"
              type="file"
              multiple
              accept={ACCEPTED_FILE_INPUT}
              onChange={onFilesChosen}
              aria-describedby={`printing-files-hint${fileError ? ' printing-files-error' : ''}`}
              aria-invalid={fileError ? true : undefined}
              className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:min-h-10 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:font-medium file:text-brand-700"
            />
            {fileError ? (
              <p
                id="printing-files-error"
                className="mt-1.5 text-sm text-red-700"
              >
                {fileError}
              </p>
            ) : null}
            {files.length > 0 ? (
              <ul aria-label="File terpilih" className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 break-all text-slate-800">
                      {file.name}{' '}
                      <span className="text-slate-500">
                        ({formatFileSize(file.size)})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="min-h-9 rounded-md px-3 font-medium text-red-700 hover:bg-red-50"
                      aria-label={`Hapus ${file.name}`}
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <TextAreaField
            label="Kebutuhan cetak"
            optional
            hint="Misalnya: A4, hitam putih, 2 rangkap, dijilid spiral."
            error={form.formState.errors.description?.message}
            {...form.register('description', {
              validate: (value) =>
                validateLongText(value, {
                  required: false,
                  label: 'Kebutuhan cetak',
                }),
            })}
          />
        </fieldset>
      </OrderFormFrame>
    </FormProvider>
  )
}
