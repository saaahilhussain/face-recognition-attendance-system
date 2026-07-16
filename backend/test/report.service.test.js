import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderReport } from '../src/services/report.service.js'

const report = {
  title: 'Daily Attendance Report',
  type: 'daily',
  columns: [
    { key: 'employeeCode', label: 'Employee Code' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'status', label: 'Status' },
  ],
  rows: [
    {
      employeeCode: 'EMP001',
      fullName: 'Test Admin',
      status: 'present',
    },
  ],
}

describe('report rendering', () => {
  it('renders CSV output', () => {
    const rendered = renderReport(report, 'csv')

    assert.equal(rendered.contentType, 'text/csv; charset=utf-8')
    assert.equal(rendered.extension, 'csv')
    assert.match(rendered.body, /"Employee Code","Full Name","Status"/)
    assert.match(rendered.body, /"EMP001","Test Admin","present"/)
  })

  it('renders Excel-compatible HTML output', () => {
    const rendered = renderReport(report, 'excel')

    assert.equal(rendered.contentType, 'application/vnd.ms-excel; charset=utf-8')
    assert.equal(rendered.extension, 'xls')
    assert.match(rendered.body, /<table border="1">/)
    assert.match(rendered.body, /Test Admin/)
  })

  it('renders PDF output', () => {
    const rendered = renderReport(report, 'pdf')

    assert.equal(rendered.contentType, 'application/pdf')
    assert.equal(rendered.extension, 'pdf')
    assert.ok(Buffer.isBuffer(rendered.body))
    assert.match(rendered.body.toString('utf8', 0, 8), /%PDF-1.4/)
  })

  it('renders JSON output by default', () => {
    const rendered = renderReport(report)

    assert.equal(rendered.contentType, 'application/json')
    assert.equal(rendered.extension, 'json')
    assert.equal(rendered.body.status, 'ok')
    assert.equal(rendered.body.report.type, 'daily')
  })
})
