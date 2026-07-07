const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------
// 1. Locate MSVC compiler
// ------------------------------------------------------------
function findMSVC() {
    const baseDirs = [
        'C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC',
        'C:/Program Files/Microsoft Visual Studio/2022/Professional/VC/Tools/MSVC',
        'C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Tools/MSVC',
        'C:/Program Files (x86)/Microsoft Visual Studio/2019/Community/VC/Tools/MSVC',
        'C:/Program Files (x86)/Microsoft Visual Studio/2019/Professional/VC/Tools/MSVC',
        'C:/Program Files (x86)/Microsoft Visual Studio/2019/Enterprise/VC/Tools/MSVC',
    ];
    let found = null;
    for (const base of baseDirs) {
        if (fs.existsSync(base)) {
            const versions = fs.readdirSync(base).filter(v => v.match(/^\d+\.\d+\.\d+$/)).sort();
            if (versions.length > 0) {
                const latest = versions[versions.length - 1];
                const msvcPath = path.join(base, latest);
                const clPath = path.join(msvcPath, 'bin', 'Hostx64', 'x64', 'cl.exe');
                if (fs.existsSync(clPath)) {
                    found = {
                        root: msvcPath,
                        version: latest,
                        bin: path.join(msvcPath, 'bin', 'Hostx64', 'x64'),
                    };
                    break;
                }
            }
        }
    }
    if (!found) {
        console.error('❌ MSVC compiler not found!');
        process.exit(1);
    }
    console.log(`✅ Using MSVC ${found.version} from: ${found.root}`);
    return found;
}

// ------------------------------------------------------------
// 2. Locate Windows SDK
// ------------------------------------------------------------
function findWindowsSDK() {
    const sdkRoot = 'C:/Program Files (x86)/Windows Kits/10';
    if (!fs.existsSync(sdkRoot)) {
        console.error('❌ Windows SDK not found!');
        process.exit(1);
    }
    const includeDir = path.join(sdkRoot, 'Include');
    const versions = fs.readdirSync(includeDir)
        .filter(v => v.match(/^\d+\.\d+\.\d+\.\d+$/))
        .sort((a, b) => b.localeCompare(a));
    if (versions.length === 0) {
        console.error('❌ No Windows SDK version found!');
        process.exit(1);
    }
    const sdkVersion = versions[0];
    console.log(`✅ Using Windows SDK version: ${sdkVersion}`);
    return {
        root: sdkRoot,
        version: sdkVersion,
        include: path.join(sdkRoot, 'Include', sdkVersion),
        lib: path.join(sdkRoot, 'Lib', sdkVersion),
    };
}

// ------------------------------------------------------------
// 3. Locate CUDA
// ------------------------------------------------------------
function findCUDA() {
    const possiblePaths = [
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.8',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.7',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.5',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.4',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.3',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.2',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.1',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.0',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.7',
        'C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.6',
        'C:/CUDA',
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.existsSync(path.join(p, 'bin', 'nvcc.exe'))) {
            console.log(`✅ Found CUDA at: ${p}`);
            return { root: p, bin: path.join(p, 'bin'), include: path.join(p, 'include') };
        }
    }
    console.error('❌ CUDA not found!');
    process.exit(1);
}

// ------------------------------------------------------------
// 4. Locate protoc (optional)
// ------------------------------------------------------------
function findProtoc() {
    const candidates = [
        'C:/Users/Dan/Desktop/protobuf-35.1/bin/protoc.exe',
        'C:/Program Files/protoc/bin/protoc.exe',
        'C:/protoc/bin/protoc.exe',
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) {
            console.log(`✅ Found protoc at: ${c}`);
            return c;
        }
    }
    console.warn('⚠️ protoc not found – continuing without it (may fail if proto files are needed)');
    return null;
}

// ------------------------------------------------------------
// 5. Build the environment
// ------------------------------------------------------------
function buildEnvironment() {
    const msvc = findMSVC();
    const sdk = findWindowsSDK();
    const cuda = findCUDA();
    const protoc = findProtoc();

    const cargoBin = 'C:/Users/Dan/.cargo/bin';
    const env = Object.assign({}, process.env);

    const includePaths = [
        path.join(msvc.root, 'include'),
        path.join(sdk.include, 'ucrt'),
        path.join(sdk.include, 'shared'),
        path.join(sdk.include, 'um'),
        path.join(sdk.include, 'winrt'),
    ].join(';');

    const libPaths = [
        path.join(msvc.root, 'lib', 'x64'),
        path.join(sdk.lib, 'um', 'x64'),
        path.join(sdk.lib, 'ucrt', 'x64'),
    ].join(';');

    const pathEntries = [
        msvc.bin,
        cuda.bin,
        cargoBin,
        ...(env.PATH ? env.PATH.split(';') : []),
    ];
    const uniquePath = [...new Set(pathEntries)];
    env.PATH = uniquePath.join(';');

    env.VCINSTALLDIR = msvc.root;
    env.VSINSTALLDIR = path.dirname(path.dirname(msvc.root));
    env.VCToolsVersion = msvc.version;
    env.WindowsSdkDir = sdk.root;
    env.WindowsSDKVersion = sdk.version + '\\';

    env.INCLUDE = includePaths;
    env.LIB = libPaths;

    env.CC = path.join(msvc.bin, 'cl.exe');
    env.CXX = path.join(msvc.bin, 'cl.exe');
    env.CUDAHOSTCXX = path.join(msvc.bin, 'cl.exe');
    env.NVCC_CCBIN = msvc.bin;
    env.NVCC_FLAGS = '-allow-unsupported-compiler';
    env.CXXFLAGS = '-D_SILENCE_ALL_CXX20_DEPRECATION_WARNINGS -D_ENABLE_EXTENDED_ALIGNED_STORAGE';

    if (protoc) {
        env.PROTOC = protoc;
    }

    console.log('🔧 Environment variables:');
    console.log(`  PATH = ${env.PATH}`);
    console.log(`  VCINSTALLDIR = ${env.VCINSTALLDIR}`);
    console.log(`  VSINSTALLDIR = ${env.VSINSTALLDIR}`);
    console.log(`  VCToolsVersion = ${env.VCToolsVersion}`);
    console.log(`  WindowsSdkDir = ${env.WindowsSdkDir}`);
    console.log(`  WindowsSDKVersion = ${env.WindowsSDKVersion}`);
    console.log(`  INCLUDE = ${env.INCLUDE}`);
    console.log(`  LIB = ${env.LIB}`);
    console.log(`  CC = ${env.CC}`);
    console.log(`  CXX = ${env.CXX}`);
    console.log(`  CUDAHOSTCXX = ${env.CUDAHOSTCXX}`);
    console.log(`  NVCC_CCBIN = ${env.NVCC_CCBIN}`);
    console.log(`  NVCC_FLAGS = ${env.NVCC_FLAGS}`);
    console.log(`  CXXFLAGS = ${env.CXXFLAGS}`);
    if (protoc) console.log(`  PROTOC = ${env.PROTOC}`);

    return env;
}

// ------------------------------------------------------------
// 6. Build both crates and copy outputs
// ------------------------------------------------------------
console.log('🔨 Building Keryx components...');

const env = buildEnvironment();

// ---- Build the node (keryxd) ----
console.log('⚙️  Building keryxd (release) ...');
try {
    execSync('cd keryxd && cargo build --release', {
        stdio: 'inherit',
        env: env,
    });
} catch (error) {
    console.error('❌ Failed to build keryxd!');
    process.exit(error.status || 1);
}

// ---- Build the miner (keryx-miner) ----
console.log('⚙️  Building keryx-miner (release) ...');
try {
    execSync('cd miner-node && cargo build --release', {
        stdio: 'inherit',
        env: env,
    });
} catch (error) {
    console.error('❌ Failed to build keryx-miner!');
    process.exit(error.status || 1);
}

// ---- Create bin directory and copy both executables ----
const binDir = path.join(__dirname, 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

const nodeExe = path.join(__dirname, 'keryxd', 'target', 'release', 'keryxd.exe');
const minerExe = path.join(__dirname, 'miner-node', 'target', 'release', 'keryx-miner.exe');

if (fs.existsSync(nodeExe)) {
    const dest = path.join(binDir, 'keryxd.exe');
    fs.copyFileSync(nodeExe, dest);
    console.log(`✅ Copied keryxd.exe to ${dest}`);
} else {
    console.error('❌ keryxd.exe not found after build!');
    process.exit(1);
}

if (fs.existsSync(minerExe)) {
    const dest = path.join(binDir, 'keryx-miner.exe');
    fs.copyFileSync(minerExe, dest);
    console.log(`✅ Copied keryx-miner.exe to ${dest}`);
} else {
    console.error('❌ keryx-miner.exe not found after build!');
    process.exit(1);
}

console.log('✅ Build completed successfully.');
console.log('   Binaries are in the `bin/` folder.');