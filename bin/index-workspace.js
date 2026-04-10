#!/usr/bin/env node

/**
 * index-workspace.js — OLMUI runner. 
 * CLI Adapter for workspace indexing. All logic lives in IndexWorkspaceApp.
 */
import { IndexWorkspaceApp } from '../src/domain/IndexWorkspaceApp.js'
import { bootstrapApp } from '@nan0web/ui-cli'

bootstrapApp(IndexWorkspaceApp)
