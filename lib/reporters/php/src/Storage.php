<?php

declare(strict_types=1);

namespace TddGuard\PHPUnit;

final class Storage
{
    private string $projectRoot;

    public function __construct(string $projectRoot = '')
    {
        $this->projectRoot = PathValidator::resolveProjectRoot($projectRoot);
    }

    public function saveTest(string $content): void
    {
        $dataDir = $this->projectRoot . '/.fusion';

        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }

        file_put_contents($dataDir . '/test-results.json', $content);
    }
}
