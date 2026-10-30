import { Fragment } from 'react';
import { STAGE_COLUMNS, footerRows, headerRows, stageRows, toLines } from '../lib/kspLayout.js';

function Lines({ value, bold }) {
  return toLines(value)
    .filter((line, _, all) => line.trim() || all.length === 1)
    .map((line, i) => (
      <p key={i} className={bold ? 'ksp__strong' : undefined}>
        {line}
      </p>
    ));
}

function LabelTable({ rows }) {
  return (
    <table className="ksp__table ksp__table--labels">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>
              <Lines value={value} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function KspDocument({ ksp, meta }) {
  const footer = footerRows(ksp, meta);
  return (
    <div className="ksp">
      <h2 className="ksp__heading">Краткосрочный (поурочный) план</h2>
      <LabelTable rows={headerRows(ksp, meta)} />

      <h3 className="ksp__heading">Ход урока</h3>
      <div className="ksp__scroll">
        <table className="ksp__table ksp__table--stages">
          <thead>
            <tr>
              {STAGE_COLUMNS.map((col) => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stageRows(ksp).map((stage, i) => (
              <Fragment key={i}>
                {stage.showPhase && (
                  <tr className="ksp__phase">
                    <td colSpan={STAGE_COLUMNS.length}>{stage.phase}</td>
                  </tr>
                )}
                <tr>
                  <td>
                    <Lines value={stage.name} />
                    <Lines value={stage.time} bold />
                  </td>
                  <td><Lines value={stage.teacher} /></td>
                  <td><Lines value={stage.students} /></td>
                  <td><Lines value={stage.assessment} /></td>
                  <td><Lines value={stage.resources} /></td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {footer.length > 0 && <LabelTable rows={footer} />}
    </div>
  );
}
