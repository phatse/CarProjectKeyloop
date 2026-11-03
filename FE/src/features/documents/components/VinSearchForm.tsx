import { Button, Form, Input } from 'antd'
import { MONO_FONT } from '@/features/documents/utils/typography'
import { isValidVin, normalizeVin } from '@/features/documents/utils/vin'

type VinSearchFormProps = {
  onSearch: (vin: string) => void
}

type VinFormValues = {
  vin: string
}

const VIN_ERROR = 'Enter a 17-character VIN (letters I, O and Q are not used)'

export function VinSearchForm({ onSearch }: VinSearchFormProps) {
  const handleFinish = (values: VinFormValues): void => {
    onSearch(normalizeVin(values.vin))
  }

  return (
    <Form onFinish={handleFinish} requiredMark={false}>
      <Form.Item label="Vehicle identification number" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 520 }}>
          <Form.Item
            name="vin"
            noStyle
            rules={[
              { required: true, whitespace: true, message: VIN_ERROR },
              {
                validator: (_, value: string | undefined) => {
                  const raw = value ?? ''

                  // Empty is the required rule's job; failing here too prints the
                  // same message twice.
                  if (raw.trim().length === 0) {
                    return Promise.resolve()
                  }

                  return isValidVin(raw) ? Promise.resolve() : Promise.reject(new Error(VIN_ERROR))
                },
              },
            ]}
          >
            <Input
              placeholder="17 characters"
              allowClear
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.04em' }}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Search
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
