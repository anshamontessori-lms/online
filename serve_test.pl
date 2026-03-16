#!/usr/bin/perl
use strict;
use warnings;
use IO::Socket::INET;
use File::Find;
use File::Basename;

my $port = 7878;
my $root = dirname(__FILE__);
$root =~ s|\\|/|g;
print "Root: $root\n";

my %cache;
File::Find::find(sub {
    return if -d $_;
    my $full = $File::Find::name;
    $full =~ s|\\|/|g;
    my $url = $full;
    $url =~ s|^\Q$root\E||;
    open my $fh, '<:raw', $full or return;
    local $/; my $data = <$fh>; close $fh;
    $cache{$url} = { data => $data, len => length($data) };
}, $root);

print "Cached " . scalar(keys %cache) . " files\n";
print "Has /assets/css/main.css: " . (exists $cache{'/assets/css/main.css'} ? "YES" : "NO") . "\n";

my $server = IO::Socket::INET->new(LocalPort=>$port,Type=>SOCK_STREAM,Reuse=>1,Listen=>5) or die "Cannot start: $!";
print "Serving on $port\n";

while (my $client = $server->accept()) {
    $client->autoflush(1);
    my $hdrs = '';
    while (my $line = <$client>) { last if $line =~ /^\r?\n$/; $hdrs .= $line; }
    my ($path) = $hdrs =~ /^\w+\s+(\S+)/;
    $path //= '/';
    $path =~ s/\?.*//;
    $path = '/index.html' if $path eq '/';
    print "Request: [$path] -> " . (exists $cache{$path} ? "FOUND" : "NOT FOUND") . "\n";
    if (exists $cache{$path}) {
        my $f = $cache{$path};
        print $client "HTTP/1.1 200 OK\r\nContent-Length: $f->{len}\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n";
        print $client $f->{data};
    } else {
        print $client "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
    }
    $client->close();
}
