
function _generateEntity(tableName, columnNames, primaryKeys) {
  const columnNamesWithPk = columnNames.map((columnName) => (primaryKeys.includes(columnName) ? `*${columnName}` : columnName));
  const columnsStr = columnNamesWithPk.join('\n  ');
  return `entity ${tableName} {
  ${columnsStr}
}
`;
}

function _generateRelation(tableName, columnNames, primaryKeys, allPKs) {
  const allPkNames = Object.keys(allPKs);
  return columnNames.reduce(
    (acc, columnName) => {
      if (!primaryKeys.includes(columnName) && allPkNames.includes(columnName)) {
        const foreignKey = allPKs[columnName];
        return [...acc, `${tableName}::${columnName} --> ${foreignKey.tableName}::${foreignKey.columnName}`];
      }
      return acc;
    },
    [],
  );
}

export default function(tableColumns) {
  const entities = Object.entries(tableColumns)
    .reduce(
      (acc, [tableName, { columnNames, primaryKeys }]) => (
        acc + _generateEntity(tableName, columnNames, primaryKeys)
      ),
      '',
    );
  const allPKs = Object.entries(tableColumns)
    .reduce(
      (acc, [tableName, { primaryKeys }]) => {
        if (primaryKeys.length !== 1) {
          return acc;
        }

        const primaryKey = primaryKeys[0];
        const primaryKeyName = primaryKey.startsWith(tableName) ? primaryKey : `${tableName}_${primaryKey}`;
        const foreignKey = { tableName, columnName: primaryKey };
        return { ...acc, [primaryKeyName]: foreignKey };
      },
      {},
    );
  const relations = Object.entries(tableColumns)
    .reduce(
      (acc, [tableName, { columnNames, primaryKeys }]) => [
        ...acc, ..._generateRelation(tableName, columnNames, primaryKeys, allPKs),
      ],
      [],
    );

  // https://plantuml.com/ko/ie-diagram
  return `@startuml

' hide the spot
hide circle
hide methods
hide stereotypes

' avoid problems with angled crows feet
skinparam linetype ortho

${entities}

${relations.join('\n')}

@enduml
`;
}
