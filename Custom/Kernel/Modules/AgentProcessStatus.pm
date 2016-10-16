# --
# Copyright (C) 2016 Perl-Services.de, http://perl-services.de
# --
# This software comes with ABSOLUTELY NO WARRANTY. For details, see
# the enclosed file COPYING for license information (AGPL). If you
# did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
# --

package Kernel::Modules::AgentProcessStatus;

use strict;
use warnings;

use Kernel::Language qw(Translatable);
use Kernel::System::VariableCheck qw(:all);

our $ObjectManagerDisabled = 1;

sub new {
    my ( $Type, %Param ) = @_;

    # allocate new hash for object
    my $Self = {%Param};
    bless( $Self, $Type );

    return $Self;
}

sub Run {
    my ( $Self, %Param ) = @_;

    my $ParamObject   = $Kernel::OM->Get('Kernel::System::Web::Request');
    my $LayoutObject  = $Kernel::OM->Get('Kernel::Output::HTML::Layout');
    my $TicketObject  = $Kernel::OM->Get('Kernel::System::Ticket');
    my $ProcessObject = $Kernel::OM->Get('Kernel::System::ProcessManagement::DB::Process');
    my $ConfigObject  = $Kernel::OM->Get('Kernel::Config');

    my $TicketID = $ParamObject->GetParam( Param => 'TicketID' );

    if ( !$TicketID ) {
        return $LayoutObject->ErrorScreen(
            Message => Translatable('No TicketID is given!'),
            Comment => Translatable('Please contact the administrator.'),
        );
    }

    # check permissions
    my $Access = $TicketObject->TicketPermission(
        Type     => 'ro',
        TicketID => $TicketID,
        UserID   => $Self->{UserID}
    );

    # error screen, don't show ticket
    if ( !$Access ) {
        return $LayoutObject->NoPermission(
            Message    => Translatable('We are sorry, you do not have permissions anymore to access this ticket in its current state.'),
            WithHeader => 'yes',
        );
    }


    my %Ticket = $TicketObject->TicketGet(
        TicketID      => $TicketID,
        UserID        => $Self->{UserID},
        DynamicFields => 1,
    );

    if ( !%Ticket ) {
        return $LayoutObject->ErrorScreen(
            Message => Translatable('No Ticket found!'),
            Comment => Translatable('Please contact the administrator.'),
        );
    }

    my $ProcessID = $Ticket{DynamicField_ProcessManagementProcessID};

    # check for ProcessID
    if ( !$ProcessID ) {
        return $LayoutObject->ErrorScreen(
            Message => Translatable('Need ProcessID!'),
        );
    }

    # get Process data
    my $ProcessData = $ProcessObject->ProcessGet(
        EntityID => $ProcessID,
        UserID   => $Self->{UserID},
    );

    # check for valid Process data
    if ( !IsHashRefWithData($ProcessData) ) {
        return $LayoutObject->ErrorScreen(
            Message => $LayoutObject->{LanguageObject}->Translate( 'Could not get data for ProcessID %s', $ProcessID ),
        );
    }

    my $ActivityID       = $Ticket{DynamicField_ProcessManagementActivityID};
    my $ActiveBackground = $ConfigObject->Get('') || '#ff0000';

    return $Self->_ShowEdit(
        %Param,
        Ticket           => \%Ticket,
        ActivityEntityID => $ActivityID,
        ProcessEntityID  => $ProcessID,
        ProcessID        => $ProcessData->{ID},
        ProcessData      => $ProcessData,
        ActiveBackground => $ActiveBackground,
    );
}

sub _ShowEdit {
    my ( $Self, %Param ) = @_;

    # get process information
    my $ProcessData = $Param{ProcessData} || {};

    my $LayoutObject = $Kernel::OM->Get('Kernel::Output::HTML::Layout');

    my $Output = $LayoutObject->Header( Type => 'Small' );

    # set db dump as config settings
    my $ProcessDump = $Kernel::OM->Get('Kernel::System::ProcessManagement::DB::Process')->ProcessDump(
        ResultType => 'HASH',
        UserID     => $Self->{UserID},
    );

    my %Configs;

    for my $Type ( qw/Process Activity ActivityDialog Transition TransitionAction/ ) {
        $Configs{ $Type . "Config" } = $LayoutObject->JSONEncode(
            Data => $ProcessDump->{$Type},
        );
    }

    my $ProcessLayoutJSON = $LayoutObject->JSONEncode(
        Data => $ProcessData->{Layout},
    );

    $LayoutObject->Block(
        Name => 'ConfigSet',
        Data => {
            ProcessLayout    => $ProcessLayoutJSON,
            ActiveBackground => $Param{ActiveBackground},
            %Configs,
        },
    );

    $Output .= $LayoutObject->Output(
        TemplateFile => "AgentProcessStatus",
        Data         => {
            %Param,
            %{ $Param{Ticket} || {} },
            %{$ProcessData},
            Description => $ProcessData->{Config}->{Description} || '',
        },
    );

    $Output .= $LayoutObject->Footer( Type => 'Small' );

    return $Output;
}

1;
