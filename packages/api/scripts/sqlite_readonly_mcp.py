"""
Read-only SQLite MCP server wrapper.
Patches mcp_server_sqlite to open the database in read-only mode (URI ?mode=ro),
so write_query, create_table, and any INSERT/UPDATE/DELETE/DROP will fail
at the SQLite engine level regardless of LLM prompt injection.
"""
import sys
import sqlite3
import asyncio
import argparse
from unittest.mock import patch
from mcp_server_sqlite import server


_original_connect = sqlite3.connect

def readonly_connect(database, *args, **kwargs):
    """Wrap sqlite3.connect to force read-only mode via URI."""
    db_str = str(database)
    if not db_str.startswith("file:"):
        db_str = f"file:{db_str}?mode=ro"
    elif "mode=" not in db_str:
        db_str = f"{db_str}?mode=ro"
    kwargs["uri"] = True
    return _original_connect(db_str, *args, **kwargs)


def main():
    parser = argparse.ArgumentParser(description="Read-only SQLite MCP Server")
    parser.add_argument("--db-path", required=True, help="Path to SQLite database file")
    args = parser.parse_args()

    with patch("sqlite3.connect", readonly_connect):
        asyncio.run(server.main(args.db_path))


if __name__ == "__main__":
    main()
