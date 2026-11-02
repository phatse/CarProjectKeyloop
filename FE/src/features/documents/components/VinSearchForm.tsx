import { Button, Form, Input } from 'antd'
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
    <Form layout="vertical" onFinish={handleFinish} requiredMark={false} style={{ maxWidth: 480 }}>
      <Form.Item
        name="vin"
        label="VIN"
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
          placeholder="1HGCM82633A004352"
          allowClear
          size="large"
          style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" size="large">
          Search
        </Button>
      </Form.Item>
    </Form>
  )
}
