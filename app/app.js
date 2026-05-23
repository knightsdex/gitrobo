const state = {
    auditRecords: [],
    artifactHash: "0xartifact...demo",
    connectedWallet: null,
    deployed: false,
    proofs: 18,
    gitlawb: {},
    releaseHash: "0x8fa2...21c9",
    releaseVersion: "v0.8.1",
    signer: "robotics-lead.eth",
    signature: "0xsig...demo",
  };
  
  const defaultSigner = "robotics-lead.eth";
  const defaultSignature = "0xsig...demo";
  const liveGitLawbRepoUrl = "https://gitlawb.com/node/repos/z6MktmKxVdA3a5hNb9Up4bA8tkC8ZEpnSwze2TKWmjgLWxpx/gitrobo-arm-v1";
  
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  
  const shortHash = () => {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
  };
  
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  
  const compactAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const compactHash = (hash) => (hash?.length > 18 ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash);
  
  const compactRef = (ref) => (ref?.length > 26 ? `${ref.slice(0, 12)}...${ref.slice(-8)}` : ref || "--");
  
  const walletLabel = (identity) => {
    if (!identity) return "Connect Wallet";
    if (identity.startsWith("0x")) return compactAddress(identity);
    if (identity.startsWith("did:")) return "Demo Wallet";
    return identity;
  };
  
  const renderWalletState = () => {
    const connectButton = document.querySelector("#connect-wallet");
    const disconnectButton = document.querySelector("#disconnect-wallet");
    const isConnected = Boolean(state.connectedWallet);
  
    if (connectButton) {
      connectButton.textContent = isConnected ? walletLabel(state.connectedWallet) : "Connect Wallet";
      connectButton.classList.toggle("wallet-connected", isConnected);
      connectButton.setAttribute("aria-pressed", String(isConnected));
      connectButton.setAttribute("aria-label", isConnected ? "Switch wallet" : "Connect wallet");
      connectButton.title = isConnected ? "Switch wallet" : "Connect wallet";
    }
  
    if (disconnectButton) {
      disconnectButton.hidden = !isConnected;
      disconnectButton.disabled = !isConnected;
      disconnectButton.setAttribute("aria-hidden", String(!isConnected));
      disconnectButton.classList.toggle("is-hidden", !isConnected);
    }
  };
  
  const applyConnectedWallet = (account) => {
    state.connectedWallet = account;
    state.signer = account;
    setText("#wallet-identity", account.startsWith("0x") ? compactAddress(account) : account);
    renderWalletState();
  };
  
  const resetWalletSession = (message = "Wallet disconnected. Connect a wallet before approving the next release.") => {
    state.connectedWallet = null;
    state.signer = defaultSigner;
    state.signature = defaultSignature;
  
    setText("#wallet-identity", defaultSigner);
    setText("#release-signature", defaultSignature);
    setText("#release-note", message);
    setText("#audit-signature", "waiting");
    renderWalletState();
  };
  
  const applyGitLawbState = (gitlawb = {}) => {
    state.gitlawb = {
      ...state.gitlawb,
      ...gitlawb,
    };
  
    const statusLabels = {
      "ref-created": "Native Ref",
      mirrored: "Synced",
      ready: "Ready",
      synced: "Synced",
    };
    const modeLabels = {
      "native-local": "GitLawb Native (local fallback)",
      "native-node": "GitLawb Node",
      configured: "GitLawb Node",
      compatibility: "Compatibility",
    };
    const status = statusLabels[state.gitlawb.status] || "Ready";
    const mode = modeLabels[state.gitlawb.mode] || "GitLawb Native";
    const link = document.querySelector("#gitlawb-link");
  
    setText("#gitlawb-status", status);
    setText("#gitlawb-mode", mode);
    setText("#gitlawb-repo", state.gitlawb.repoDid || "--");
    setText("#gitlawb-cid", compactRef(state.gitlawb.latestRefCid));
    setText("#gitlawb-certificate", compactRef(state.gitlawb.refCertificate));
    setText("#gitlawb-event", state.gitlawb.lastMirrorEvent || "GitLawb native repository layer ready");
  
    if (link) {
      link.href = state.gitlawb.repoUrl || liveGitLawbRepoUrl;
      link.textContent = "GitLawb Native Profile";
    }
  };
  
  const renderLedger = (records = state.auditRecords) => {
    const ledger = document.querySelector("#proof-ledger");
    if (!ledger) return;
  
    const latestRecords = records.slice(-6).reverse();
    ledger.innerHTML = latestRecords
      .map((record, index) => ({ ...record, index }))
      .map(
        (record) => `
          <article class="proof-event" data-proof-index="${record.index}">
            <span>${record.type}</span>
            <div>
              <strong>${record.title}</strong>
              <p>${record.detail}</p>
            </div>
            <code>${record.tx}</code>
          </article>
        `,
      )
      .join("");
  
    ledger.querySelectorAll(".proof-event").forEach((eventCard) => {
      eventCard.addEventListener("click", () => {
        const record = latestRecords[Number(eventCard.dataset.proofIndex)];
        openProofDrawer(record);
      });
    });
  };
  
  const explorerUrl = (tx) => {
    if (!tx || tx.includes("...")) return "#";
    return `https://sepolia.basescan.org/tx/${tx}`;
  };
  
  const openProofDrawer = (record) => {
    const drawer = document.querySelector("#proof-drawer");
    if (!drawer || !record) return;
  
    setText("#drawer-title", record.title);
    setText("#drawer-type", record.type);
    setText("#drawer-mode", record.mode || "mock");
    setText("#drawer-tx", record.tx);
    setText("#drawer-time", record.timestamp || "--");
    setText("#drawer-detail", record.detail);
  
    const explorer = document.querySelector("#drawer-explorer");
    if (explorer) {
      explorer.href = explorerUrl(record.tx);
      explorer.textContent = record.tx?.includes("...") ? "Mock Tx" : "View Explorer";
    }
  
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  };
  
  const closeProofDrawer = () => {
    const drawer = document.querySelector("#proof-drawer");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  };
  
  const apiRequest = async (path, payload) => {
    try {
      const response = await fetch(path, {
        method: payload ? "POST" : "GET",
        headers: payload ? { "Content-Type": "application/json" } : {},
        body: payload ? JSON.stringify(payload) : undefined,
      });
  
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        return null;
      }
  
      return response.json();
    } catch {
      return null;
    }
  };
  
  const applyProjectState = (project) => {
    if (!project) return;
  
    state.releaseVersion = project.releaseVersion || state.releaseVersion;
    state.releaseHash = project.releaseHash || state.releaseHash;
    state.artifactHash = project.artifactHash || state.artifactHash;
    state.proofs = Number(project.proofs || state.proofs);
    state.deployed = Boolean(project.deployed);
    state.signer = project.signer || state.signer;
    state.signature = project.signature || state.signature;
    state.auditRecords = project.auditRecords || state.auditRecords;
    state.gitlawb = project.gitlawb || state.gitlawb;
  
    setText("#metric-ci", project.ciStatus || "Passed");
    setText("#metric-release", state.releaseVersion);
    setText("#metric-fleet", project.fleet || "3 Robots");
    setText("#metric-proofs", `${state.proofs} Records`);
    setText("#repo-release-name", `releases/${state.releaseVersion}`);
    setText("#release-label", `Release ${state.releaseVersion}`);
    setText("#release-hash", state.releaseHash);
    setText("#artifact-hash", compactHash(state.artifactHash));
    setText("#audit-tx", project.registryTx || "0x71e...44ab");
    setText("#audit-event", project.lastEvent || "release signed");
    setText("#wallet-identity", state.signer);
    setText("#release-signature", state.signature);
    renderWalletState();
    applyGitLawbState(state.gitlawb);
    renderLedger();
  };
  
  const applyConfig = (config) => {
    if (!config) return;
    const modeLabel = config.proofRegistryMode === "on-chain" ? "On-chain Registry" : "Mock Registry";
    const detail = config.contractAddress
      ? `${config.network}: ${compactHash(config.contractAddress)}`
      : `${config.network || "local"} proof adapter connected`;
  
    setText("#registry-mode", config.repoProvider === "gitlawb" ? "GitLawb Repository" : modeLabel);
    setText("#registry-detail", config.repoProvider === "gitlawb" ? "Native repo provider with proof registry fallback" : detail);
    if (config.gitlawb) applyGitLawbState(config.gitlawb);
  };
  
  const updateProofs = (count = 1) => {
    state.proofs += count;
    setText("#metric-proofs", `${state.proofs} Records`);
  };
  
  const setPipelineState = (status) => {
    document.querySelectorAll("[data-check]").forEach((card) => {
      card.dataset.status = status;
    });
  };
  
  const localValidateManifest = (manifest) => {
    const requiredKeys = ["name:", "runtime:", "hardware:", "simulation:", "deploy:", "audit:"];
    const missing = requiredKeys.filter((key) => !manifest.includes(key));
    return {
      ok: missing.length === 0,
      missing,
      message: missing.length
        ? `Manifest missing required keys: ${missing.join(" ")}`
        : "Manifest is valid and ready for simulation.",
    };
  };
  
  const validateManifest = async () => {
    const editor = document.querySelector("#manifest-editor");
    const feedback = document.querySelector("#manifest-feedback");
    if (!editor || !feedback) return false;
  
    const validation =
      (await apiRequest("/api/manifest/validate", { manifest: editor.value })) ||
      localValidateManifest(editor.value);
  
    if (!validation.ok) {
      feedback.textContent = validation.message;
      feedback.dataset.state = "warning";
      setText("#manifest-state", "needs review");
      return false;
    }
  
    feedback.textContent = validation.message;
    feedback.dataset.state = "success";
    setText("#manifest-state", "validated now");
    return true;
  };
  
  const connectWallet = async () => {
    const button = document.querySelector("#connect-wallet");
    if (!button) return;
  
    button.disabled = true;
  
    if (window.ethereum?.request) {
      try {
        try {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch {
          // Some wallets do not support explicit permission prompts. eth_requestAccounts remains the fallback.
        }
  
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const selectedAccount = accounts?.[0];
        if (!selectedAccount) {
          resetWalletSession("No wallet account selected. Connect a wallet before approving the next release.");
          button.disabled = false;
          return;
        }
  
        applyConnectedWallet(selectedAccount);
        button.disabled = false;
        return;
      } catch {
        button.textContent = "Wallet Rejected";
        button.disabled = false;
        return;
      }
    }
  
    applyConnectedWallet("did:gitrobo:operator-demo");
    button.disabled = false;
  };
  
  const disconnectWallet = () => {
    resetWalletSession();
  };
  
  const signReleasePayload = async () => {
    const message = [
      "GitRobo Release Approval",
      `robot: gitrobo-arm-v1`,
      `release: ${state.releaseVersion}`,
      `artifact: ${state.releaseHash}`,
      `target: lab-arm-01`,
    ].join("\n");
  
    if (window.ethereum?.request && state.signer.startsWith("0x")) {
      try {
        return await window.ethereum.request({
          method: "personal_sign",
          params: [message, state.signer],
        });
      } catch {
        return `0xrejected...${shortHash().slice(-4)}`;
      }
    }
  
    return `0xsig...${shortHash().slice(-4)}`;
  };
  
  const runSimulation = async () => {
    if (!(await validateManifest())) return;
  
    const button = document.querySelector("#run-simulation");
    const status = document.querySelector("#ci-status");
    if (!button || !status) return;
  
    button.disabled = true;
    status.textContent = "Simulation running";
    setText("#metric-ci", "Running");
    setPipelineState("running");
  
    const [result] = await Promise.all([apiRequest("/api/simulation/run", {}), wait(900)]);
  
    status.textContent = result?.ciStatus || "All checks passed";
    setText("#metric-ci", "Passed");
    setPipelineState("passed");
    setText("#audit-event", result?.lastEvent || "simulation proof recorded");
  
    if (result?.proofs) {
      state.proofs = result.proofs;
      setText("#metric-proofs", `${state.proofs} Records`);
    } else {
      updateProofs(1);
    }
  
    button.disabled = false;
  };
  
  const createRelease = async () => {
    if (!(await validateManifest())) return;
  
    const signature = await signReleasePayload();
  
    const result = await apiRequest("/api/releases", {
      currentVersion: state.releaseVersion,
      manifest: document.querySelector("#manifest-editor")?.value || "",
      signature,
      signer: state.signer,
    });
  
    if (result) {
      state.releaseVersion = result.releaseVersion;
      state.releaseHash = result.releaseHash;
      state.artifactHash = result.artifactHash || state.artifactHash;
      state.proofs = result.proofs;
      state.deployed = false;
      state.signature = result.signature || signature;
      state.signer = result.signer || state.signer;
      state.auditRecords = result.auditRecords || state.auditRecords;
      state.gitlawb = result.gitlawb || state.gitlawb;
    } else {
      const nextPatch = Number(state.releaseVersion.split(".").at(-1)) + 1;
      state.releaseVersion = `v0.8.${nextPatch}`;
      state.releaseHash = shortHash();
      state.deployed = false;
      state.signature = signature;
      updateProofs(2);
    }
  
    setText("#metric-release", state.releaseVersion);
    setText("#metric-proofs", `${state.proofs} Records`);
    setText("#repo-release-name", `releases/${state.releaseVersion}`);
    setText("#repo-release-state", "signed now");
    setText("#release-label", `Release ${state.releaseVersion}`);
    setText("#release-hash", state.releaseHash);
    setText("#artifact-hash", compactHash(state.artifactHash));
    setText("#release-note", `Signed by ${state.signer.startsWith("0x") ? compactAddress(state.signer) : state.signer} and written to the GitLawb-native repo layer.`);
    setText("#wallet-identity", state.signer.startsWith("0x") ? compactAddress(state.signer) : state.signer);
    setText("#release-signature", state.signature.length > 18 ? `${state.signature.slice(0, 8)}...${state.signature.slice(-6)}` : state.signature);
    setText("#audit-signature", "verified");
    setText("#audit-event", result?.lastEvent || "release signed");
    setText("#audit-tx", result?.registryTx || shortHash());
    applyGitLawbState(state.gitlawb);
    renderLedger();
  
    const deployButton = document.querySelector("#deploy-release");
    if (deployButton) {
      deployButton.disabled = false;
      deployButton.textContent = "Deploy to Lab Fleet";
    }
  };
  
  const mirrorGitLawbRelease = async () => {
    const button = document.querySelector("#mirror-gitlawb");
    if (button) {
      button.disabled = true;
      button.textContent = "Syncing";
    }
  
    const result = await apiRequest("/api/gitlawb/mirror", {
      releaseHash: state.releaseHash,
      releaseVersion: state.releaseVersion,
    });
  
    if (result) {
      applyProjectState(result);
      setText("#release-note", `${state.releaseVersion} synced to the GitLawb-native decentralized repo state.`);
    } else {
      applyGitLawbState({
        lastMirrorEvent: "GitLawb local fallback sync is unavailable.",
        status: "ready",
      });
    }
  
    if (button) {
      button.disabled = false;
      button.textContent = "Sync Ref";
    }
  };
  
  const deployRelease = async () => {
    if (state.deployed) return;
  
    const result = await apiRequest("/api/deploy", {
      releaseVersion: state.releaseVersion,
      releaseHash: state.releaseHash,
      signer: state.signer,
      target: "lab-arm-01",
    });
  
    state.deployed = true;
    if (result?.proofs) state.proofs = result.proofs;
    if (result?.auditRecords) state.auditRecords = result.auditRecords;
    if (result?.gitlawb) state.gitlawb = result.gitlawb;
  
    setText("#metric-fleet", result?.fleet || "4 Robots");
    setText("#metric-proofs", `${state.proofs} Records`);
    setText("#release-note", `${state.releaseVersion} deployed to lab-arm-01 with rollback available.`);
    setText("#audit-target", "lab-arm-01 deployed");
    setText("#audit-event", result?.lastEvent || "fleet deployment recorded");
    setText("#audit-tx", result?.registryTx || shortHash());
    applyGitLawbState(state.gitlawb);
    renderLedger();
  
    const deployButton = document.querySelector("#deploy-release");
    if (deployButton) {
      deployButton.disabled = true;
      deployButton.textContent = "Deployed";
    }
  
    if (!result?.proofs) updateProofs(3);
  };
  
  const bootstrap = async () => {
    applyProjectState(await apiRequest("/api/project"));
    applyConfig(await apiRequest("/api/config"));
  
    document.querySelector("#connect-wallet")?.addEventListener("click", connectWallet);
    document.querySelector("#disconnect-wallet")?.addEventListener("click", disconnectWallet);
    document.querySelector("#close-proof-drawer")?.addEventListener("click", closeProofDrawer);
    document.querySelector("#validate-manifest")?.addEventListener("click", validateManifest);
    document.querySelector("#run-simulation")?.addEventListener("click", runSimulation);
    document.querySelector("#create-release")?.addEventListener("click", createRelease);
    document.querySelector("#deploy-release")?.addEventListener("click", deployRelease);
    document.querySelector("#mirror-gitlawb")?.addEventListener("click", mirrorGitLawbRelease);
  
    if (window.ethereum?.on) {
      window.ethereum.on("accountsChanged", (accounts = []) => {
        const [account] = accounts;
        if (account) {
          applyConnectedWallet(account);
        } else {
          resetWalletSession("Wallet account access was removed. Connect another wallet before approving the next release.");
        }
      });
    }
  
    document.querySelectorAll(".sidebar__nav a").forEach((link) => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".sidebar__nav a").forEach((item) => item.classList.remove("is-active"));
        link.classList.add("is-active");
      });
    });
  };
  
  bootstrap();
  