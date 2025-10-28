#!/usr/bin/env python3
"""
Script para extrair dados do arquivo SQL grc-web.sql e converter para JSON e CSV
"""

import re
import json
import csv
from pathlib import Path
from typing import List, Dict

# Definir colunas da tabela alerta_cooperativa_sicoob
COLUMNS = [
    'cd_sistema', 'cd_central', 'cd_cooperativa', 'ano', 'mes',
    # Notas (30 indicadores)
    'nota_sobras_ou_perdas_sobre_recursos_totais', 'nota_inadimplencia', 
    'nota_liquidez_na_central', 'nota_adto_depositante', 
    'nota_custo_fixo_sobre_total_recursos', 'nota_tarifas_sobre_custo_fixo',
    'nota_honorarios_e_cedula_sobre_custo_fixo', 'nota_folha_encargos_sobre_total_recursos',
    'nota_receita_financeira_sobre_total_recursos', 'nota_retorno_carteira_de_credito',
    'nota_despesas_financeiras_sobre_recursos_captados', 'nota_despesas_captacao_sobre_dep_prazo',
    'nota_resultado_PCLD_sobre_despesas_totais_mes', 'nota_resultado_PCLD_sobre_total_recursos',
    'nota_liquidez_geral', 'nota_participacao_capital_proprio',
    'nota_rentabilidade_sobras_sobre_receitas_brutas', 'nota_rentabilidade_sobre_capital_proprio',
    'nota_evolucao_quadro_social', 'nota_limite_exposicao_por_cliente',
    'nota_concentacao_carteira_credito', 'nota_enquadramento_PRE',
    'nota_concentracao_depositos', 'nota_imobilizacao_capital_proprio',
    'nota_evolucao_patrimonial',
    # Alertas (30 indicadores)
    'alerta_sobras_ou_perdas_sobre_recursos_totais', 'alerta_inadimplencia',
    'alerta_liquidez_na_central', 'alerta_adto_depositante',
    'alerta_custo_fixo_sobre_total_recursos', 'alerta_tarifas_sobre_custo_fixo',
    'alerta_honorarios_e_cedula_sobre_custo_fixo', 'alerta_folha_encargos_sobre_total_recursos',
    'alerta_receita_financeira_sobre_total_recursos', 'alerta_retorno_carteira_de_credito',
    'alerta_despesas_financeiras_sobre_recursos_captados', 'alerta_despesas_captacao_sobre_dep_prazo',
    'alerta_resultado_PCLD_sobre_despesas_totais_mes', 'alerta_resultado_PCLD_sobre_total_recursos',
    'alerta_liquidez_geral', 'alerta_participacao_capital_proprio',
    'alerta_rentabilidade_sobras_sobre_receitas_brutas', 'alerta_rentabilidade_sobre_capital_proprio',
    'alerta_evolucao_quadro_social', 'alerta_limite_exposicao_por_cliente',
    'alerta_concentacao_carteira_credito', 'alerta_enquadramento_PRE',
    'alerta_concentracao_depositos', 'alerta_imobilizacao_capital_proprio',
    'alerta_evolucao_patrimonial',
    # Campos auxiliares
    'total', 'nu_justificativa', 'nu_plano', 
    'tx_justificativa', 'tx_plano', 'st_justificativa', 'st_plano'
]

def parse_sql_insert_values(sql_content: str) -> List[Dict]:
    """
    Extrai valores dos INSERT statements do SQL
    """
    records = []
    
    # Encontrar todos os INSERT INTO statements
    insert_pattern = r"INSERT INTO `alerta_cooperativa_sicoob`.*?VALUES\s*\(([^;]+)\);"
    matches = re.findall(insert_pattern, sql_content, re.MULTILINE | re.DOTALL)
    
    for match in matches:
        # Split por registros individuais (separados por ),( )
        rows = re.split(r'\),\s*\(', match)
        
        for row in rows:
            # Remover parênteses extras
            row = row.strip().strip('()')
            
            # Parse dos valores (considerando strings entre aspas)
            values = []
            current_value = ''
            in_quotes = False
            
            for char in row:
                if char == "'" and not in_quotes:
                    in_quotes = True
                    current_value = ''
                elif char == "'" and in_quotes:
                    in_quotes = False
                    values.append(current_value)
                    current_value = ''
                elif char == ',' and not in_quotes:
                    if current_value.strip():
                        values.append(current_value.strip())
                    current_value = ''
                else:
                    current_value += char
            
            # Adicionar último valor
            if current_value.strip():
                values.append(current_value.strip())
            
            # Criar registro se tiver o número correto de colunas
            if len(values) == len(COLUMNS):
                record = {}
                for col, val in zip(COLUMNS, values):
                    # Converter tipos
                    if val == '' or val == "''":
                        record[col] = None
                    elif col in ['ano', 'mes']:
                        record[col] = int(val)
                    elif col.startswith('nota_') or col.startswith('alerta_') or col in ['total', 'nu_justificativa', 'nu_plano', 'st_justificativa', 'st_plano']:
                        record[col] = int(val)
                    elif col in ['cd_sistema', 'cd_central', 'cd_cooperativa']:
                        record[col] = int(val)
                    else:
                        record[col] = val
                
                records.append(record)
    
    return records

def save_to_json(records: List[Dict], output_path: Path):
    """
    Salvar registros em formato JSON
    """
    # Organizar por cooperativa
    by_cooperativa = {}
    for record in records:
        coop_key = f"cooperativa_{record['cd_cooperativa']}"
        if coop_key not in by_cooperativa:
            by_cooperativa[coop_key] = []
        by_cooperativa[coop_key].append(record)
    
    # Salvar arquivo consolidado
    output_data = {
        "metadata": {
            "total_records": len(records),
            "total_cooperativas": len(by_cooperativa),
            "fonte": "grc-web.sql",
            "data_extracao": "2025-10-23"
        },
        "data": records
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ JSON salvo: {output_path}")
    
    # Salvar arquivos separados por cooperativa
    for coop_key, coop_records in by_cooperativa.items():
        coop_file = output_path.parent / 'balances' / f"{coop_key}.json"
        with open(coop_file, 'w', encoding='utf-8') as f:
            json.dump({
                "cooperativa": coop_records[0]['cd_cooperativa'],
                "total_registros": len(coop_records),
                "periodos": coop_records
            }, f, indent=2, ensure_ascii=False)
        print(f"✓ JSON por cooperativa salvo: {coop_file}")

def save_to_csv(records: List[Dict], output_path: Path):
    """
    Salvar registros em formato CSV
    """
    if not records:
        print("⚠️  Nenhum registro para salvar")
        return
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(records)
    
    print(f"✓ CSV salvo: {output_path}")

def main():
    print("="*80)
    print("EXPORTANDO DADOS DO SQL PARA JSON E CSV")
    print("="*80)
    
    # Caminhos
    sql_file = Path("/Users/ceciliodaher/Library/CloudStorage/OneDrive-Personal/Downloads/Mac-Downloads/grc-web.sql")
    output_dir = Path("/Users/ceciliodaher/Documents/git/creditscore-pro/data")
    
    if not sql_file.exists():
        print(f"❌ Arquivo SQL não encontrado: {sql_file}")
        return
    
    # Ler arquivo SQL
    print(f"\n📂 Lendo arquivo SQL...")
    with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
        sql_content = f.read()
    
    print(f"✓ Arquivo lido: {len(sql_content):,} caracteres")
    
    # Extrair dados
    print(f"\n🔍 Extraindo dados...")
    records = parse_sql_insert_values(sql_content)
    print(f"✓ Extraídos {len(records)} registros")
    
    if records:
        # Estatísticas
        cooperativas = set(r['cd_cooperativa'] for r in records)
        anos = set(r['ano'] for r in records)
        
        print(f"\n📊 Estatísticas:")
        print(f"  - Cooperativas: {len(cooperativas)} ({min(cooperativas)} a {max(cooperativas)})")
        print(f"  - Período: {min(anos)} a {max(anos)}")
        print(f"  - Total de registros: {len(records)}")
        
        # Salvar arquivos
        print(f"\n💾 Salvando arquivos...")
        save_to_json(records, output_dir / 'alerta_cooperativa_sicoob.json')
        save_to_csv(records, output_dir / 'alerta_cooperativa_sicoob.csv')
        
        print(f"\n✅ Exportação concluída com sucesso!")
    else:
        print(f"\n⚠️  Nenhum registro encontrado")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    main()
