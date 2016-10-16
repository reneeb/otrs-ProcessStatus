# --
# Kernel/Language/de_ProcessStatus.pm - the German translation for ProcessStatus
# Copyright (C) 2011-2016 Perl-Services, http://www.perl-services.de
# --
# This software comes with ABSOLUTELY NO WARRANTY. For details, see
# the enclosed file COPYING for license information (AGPL). If you
# did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
# --

package Kernel::Language::de_ProcessStatus;

use strict;
use warnings;
use utf8;

sub Data {
    my $Self = shift;

    my $Lang = $Self->{Translation};

    return if ref $Lang ne 'HASH';

    # Kernel/Config/Files/ProcessStatus.xml
    $Lang->{'Shows a link in the menu to show currenct process status.'} = '';
    $Lang->{'ProcessStatus'} = '';
    $Lang->{'Show current process status.'} = '';
    $Lang->{'Enable/Disable debugging feature.'} = '';
    $Lang->{'Background color for the active activity.'} = '';
    $Lang->{'Frontend module registration for process status module.'} = '';
    $Lang->{'Current Process Status'} = '';

    # Custom/Kernel/Output/HTML/Templates/Standard/AgentProcessStatus.tt
    $Lang->{'Show current process status for ticket'} = '';
    $Lang->{'Cancel & close window'} = '';

    # Custom/Kernel/Modules/AgentProcessStatus.pm
    $Lang->{'No Ticket found!'} = '';

    return 1;
}

1;
