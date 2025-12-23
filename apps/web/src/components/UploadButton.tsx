import type { ChangeEvent } from 'react'

type UploadButtonProps = {
	label?: string
	accept?: string
	multiple?: boolean
	onFile: (file: File | FileList | null) => void
	className?: string
	testId?: string
}

export default function UploadButton({
	label = 'Upload file',
	accept,
	multiple,
	onFile,
	className = '',
	testId
}: UploadButtonProps) {
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		onFile(event.target.files)
		event.target.value = ''
	}

	return (
		<label
			className={`flex cursor-pointer items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 ${className}`}
			data-testid={testId}
		>
			<input
				type="file"
				accept={accept}
				multiple={multiple}
				className="hidden"
				onChange={handleChange}
			/>
			{label}
		</label>
	)
}
