import { TherapeuticEntry } from '../types';

interface Group {
  label: string;
  entries: TherapeuticEntry[];
}

interface Props {
  groups: Group[];
  formatLabel?: (label: string) => string;
}

export default function GroupedIndex({ groups, formatLabel }: Props) {
  return (
    <div className="index-grid">
      {groups.map((group) => (
        <section key={group.label} className="index-section">
          <h4>{formatLabel ? formatLabel(group.label) : group.label}</h4>
          <ul>
            {group.entries.map((entry) => (
              <li key={`${group.label}-${entry.id}`}>{entry.activeIngredient}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
