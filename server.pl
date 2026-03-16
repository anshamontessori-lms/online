#!/usr/bin/perl
use strict;
use warnings;
use IO::Socket::INET;
use File::Basename;
use Cwd qw(abs_path);

my $port = $ENV{PORT} || 8080;
my $root = abs_path(dirname(__FILE__));
$root =~ s|\\|/|g;

my %mime = (
    html  => 'text/html; charset=utf-8',
    css   => 'text/css',
    js    => 'application/javascript',
    json  => 'application/json',
    png   => 'image/png',
    jpg   => 'image/jpeg',
    ico   => 'image/x-icon',
    svg   => 'image/svg+xml',
    woff2 => 'font/woff2',
    woff  => 'font/woff',
    ttf   => 'font/ttf',
);

# Recursively scan and cache all files
my %cache;
sub scan_dir {
    my ($dir, $url_base) = @_;
    opendir(my $dh, $dir) or return;
    for my $entry (readdir $dh) {
        next if $entry eq '.' || $entry eq '..';
        next if $entry eq '.claude';
        my $full = "$dir/$entry";
        my $url  = "$url_base/$entry";
        if (-d $full) {
            scan_dir($full, $url);
        } else {
            my ($ext) = $entry =~ /\.(\w+)$/;
            my $type = $mime{lc($ext // '')} // 'application/octet-stream';
            open my $fh, '<:raw', $full or next;
            local $/; my $data = <$fh>; close $fh;
            $cache{$url} = { data => $data, type => $type, len => length($data) };
        }
    }
    closedir $dh;
}
scan_dir($root, '');

my $server = IO::Socket::INET->new(
    LocalPort => $port,
    Type      => SOCK_STREAM,
    Reuse     => 1,
    Listen    => 20,
) or die "Cannot start server on port $port: $!\n";

print "========================================\n";
print "  Ansha Montessori LMS\n";
print "  Running at http://localhost:$port\n";
print "  Press Ctrl+C to stop\n";
print "========================================\n";

while (my $client = $server->accept()) {
    $client->autoflush(1);
    while (1) {
        my ($hdrs, $keep) = ('', 0);
        while (my $line = <$client>) {
            $keep = 1 if $line =~ /Connection:\s*keep-alive/i;
            last if $line =~ /^\r?\n$/;
            $hdrs .= $line;
        }
        last unless $hdrs;
        my ($path) = $hdrs =~ /^\w+\s+(\S+)/;
        last unless $path;
        $path =~ s/\?.*//;
        $path = '/index.html' if $path eq '/';
        $path =~ s/\.\.//g;
        if (exists $cache{$path}) {
            my $f = $cache{$path};
            print $client
                "HTTP/1.1 200 OK\r\n" .
                "Content-Type: $f->{type}\r\n" .
                "Content-Length: $f->{len}\r\n" .
                "Cache-Control: no-cache\r\n" .
                "Connection: " . ($keep ? "keep-alive" : "close") . "\r\n" .
                "\r\n";
            print $client $f->{data};
        } else {
            print $client "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
            last;
        }
        last unless $keep;
    }
    $client->close();
}
